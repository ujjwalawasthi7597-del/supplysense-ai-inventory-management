import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/purchase-orders
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const { status, supplierId, warehouseId } = req.query;

    const filter: any = {};
    if (status && status !== 'All') filter.status = status;
    if (supplierId && supplierId !== 'All') filter.supplierId = supplierId;
    if (warehouseId && warehouseId !== 'All') filter.warehouseId = warehouseId;

    const orders = db.purchaseOrders.find(filter);

    const enriched = orders.map(po => {
      const supplier = db.suppliers.findById(po.supplierId);
      const warehouse = db.warehouses.findById(po.warehouseId);
      return {
        ...po,
        supplierName: supplier?.companyName || supplier?.name || 'Unknown Supplier',
        warehouseName: warehouse?.name || 'Unknown Warehouse',
        warehouseCode: warehouse?.warehouseCode || '',
      };
    });

    res.json({ success: true, count: enriched.length, purchaseOrders: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error fetching purchase orders' });
  }
});

// GET /api/purchase-orders/:id
router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const po = db.purchaseOrders.findById(req.params.id);
  if (!po) {
    res.status(404).json({ success: false, message: 'Purchase Order not found.' });
    return;
  }

  const supplier = db.suppliers.findById(po.supplierId);
  const warehouse = db.warehouses.findById(po.warehouseId);

  res.json({
    success: true,
    purchaseOrder: {
      ...po,
      supplier,
      warehouse,
    },
  });
});

// POST /api/purchase-orders
router.post('/', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const {
      supplierId,
      warehouseId,
      products,
      expectedDeliveryDate,
      notes = '',
      status = 'Pending Approval',
    } = req.body;

    if (!supplierId || !warehouseId || !products || !Array.isArray(products) || products.length === 0) {
      res.status(400).json({ success: false, message: 'Supplier, warehouse, and at least one product line item are required.' });
      return;
    }

    if (!expectedDeliveryDate) {
      res.status(400).json({ success: false, message: 'Expected delivery date is required.' });
      return;
    }

    // Validate and compute products total
    let totalAmount = 0;
    const validatedProducts = products.map(item => {
      const prod = db.products.findById(item.productId);
      const qty = Math.max(1, Number(item.quantity) || 1);
      const price = Number(item.unitPrice !== undefined ? item.unitPrice : (prod?.purchasePrice || 0));
      const lineTotal = Number((qty * price).toFixed(2));
      totalAmount += lineTotal;

      return {
        productId: item.productId,
        productName: prod?.name || item.productName || 'Product',
        quantity: qty,
        unitPrice: price,
        total: lineTotal,
      };
    });

    // If user is admin, they can directly set Approved or Ordered; staff creates Pending Approval or Draft
    let initialStatus: any = status;
    if (req.user?.role !== 'admin' && (status === 'Approved' || status === 'Received')) {
      initialStatus = 'Pending Approval';
    }

    const newPO = db.purchaseOrders.create({
      supplierId,
      warehouseId,
      products: validatedProducts,
      totalAmount: Number(totalAmount.toFixed(2)),
      orderDate: new Date().toISOString(),
      expectedDeliveryDate,
      status: initialStatus,
      createdBy: req.user?.name || 'Staff User',
      notes,
    });

    // Create notification if pending approval
    if (newPO.status === 'Pending Approval') {
      db.notifications.create({
        title: 'New Purchase Order Request',
        message: `${req.user?.name || 'Staff'} submitted ${newPO.poNumber} for $${newPO.totalAmount.toLocaleString()} awaiting approval.`,
        type: 'po_approval',
        isRead: false,
        link: '/purchase-orders',
      });
    }

    res.status(201).json({ success: true, purchaseOrder: newPO });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error creating purchase order' });
  }
});

// PUT /api/purchase-orders/:id/approve (Admin only)
router.put('/:id/approve', authenticate, requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const po = db.purchaseOrders.findById(req.params.id);
    if (!po) {
      res.status(404).json({ success: false, message: 'Purchase Order not found.' });
      return;
    }

    if (po.status === 'Received') {
      res.status(400).json({ success: false, message: 'Cannot change status of already received order.' });
      return;
    }

    const updated = db.purchaseOrders.findByIdAndUpdate(po._id, {
      status: 'Approved',
      approvedBy: req.user?.name || 'Admin',
    });

    res.json({ success: true, message: `${po.poNumber} has been approved.`, purchaseOrder: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error approving order' });
  }
});

// PUT /api/purchase-orders/:id/reject (Admin only)
router.put('/:id/reject', authenticate, requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const po = db.purchaseOrders.findById(req.params.id);
    if (!po) {
      res.status(404).json({ success: false, message: 'Purchase Order not found.' });
      return;
    }

    if (po.status === 'Received') {
      res.status(400).json({ success: false, message: 'Cannot reject already received order.' });
      return;
    }

    const { reason = 'Order rejected by procurement admin.' } = req.body;

    const updated = db.purchaseOrders.findByIdAndUpdate(po._id, {
      status: 'Rejected',
      notes: po.notes ? `${po.notes}\nRejection Reason: ${reason}` : `Rejection Reason: ${reason}`,
    });

    res.json({ success: true, message: `${po.poNumber} has been rejected.`, purchaseOrder: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error rejecting order' });
  }
});

// PUT /api/purchase-orders/:id/receive (Admin or authorized Staff)
router.put('/:id/receive', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const po = db.purchaseOrders.findById(req.params.id);
    if (!po) {
      res.status(404).json({ success: false, message: 'Purchase Order not found.' });
      return;
    }

    // Critical requirement: Prevent the same purchase order from increasing stock twice!
    if (po.status === 'Received') {
      res.status(400).json({
        success: false,
        message: `Order ${po.poNumber} was already received and stock was already updated on ${new Date(po.actualDeliveryDate || po.updatedAt || '').toLocaleDateString()}. Cannot receive twice!`,
      });
      return;
    }

    const now = new Date().toISOString();

    // 1. Increase each product's stock and record StockMovement
    po.products.forEach(item => {
      const product = db.products.findById(item.productId);
      if (product) {
        const newStock = product.currentStock + item.quantity;
        db.products.findByIdAndUpdate(product._id, { currentStock: newStock });

        db.stockMovements.create({
          productId: product._id,
          warehouseId: po.warehouseId,
          movementType: 'Stock In',
          quantity: item.quantity,
          reason: `Goods receipt from Purchase Order ${po.poNumber}`,
          performedBy: req.user?.name || 'Receiving Staff',
        });
      }
    });

    // 2. Update PO status
    const updated = db.purchaseOrders.findByIdAndUpdate(po._id, {
      status: 'Received',
      actualDeliveryDate: now,
    });

    // 3. Create Notification
    db.notifications.create({
      title: 'Purchase Order Received',
      message: `${po.poNumber} items received at warehouse. Inventory levels increased accordingly.`,
      type: 'stock_received',
      isRead: false,
      link: '/inventory',
    });

    res.json({
      success: true,
      message: `Purchase Order ${po.poNumber} marked as Received! Stock updated across ${po.products.length} items.`,
      purchaseOrder: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error receiving order' });
  }
});

// PUT /api/purchase-orders/:id (Update general details or status)
router.put('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const po = db.purchaseOrders.findById(req.params.id);
    if (!po) {
      res.status(404).json({ success: false, message: 'Purchase Order not found.' });
      return;
    }

    if (po.status === 'Received') {
      res.status(400).json({ success: false, message: 'Received orders cannot be edited.' });
      return;
    }

    const { status, expectedDeliveryDate, notes } = req.body;

    const updated = db.purchaseOrders.findByIdAndUpdate(po._id, {
      ...(status ? { status } : {}),
      ...(expectedDeliveryDate ? { expectedDeliveryDate } : {}),
      ...(notes !== undefined ? { notes } : {}),
    });

    res.json({ success: true, purchaseOrder: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error updating order' });
  }
});

export default router;
