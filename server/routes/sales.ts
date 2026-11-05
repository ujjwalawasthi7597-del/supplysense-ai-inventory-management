import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticate, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/sales
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const { startDate, endDate, search } = req.query;

    let sales = db.sales.find();

    if (startDate && typeof startDate === 'string') {
      sales = sales.filter(s => new Date(s.saleDate) >= new Date(startDate));
    }

    if (endDate && typeof endDate === 'string') {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      sales = sales.filter(s => new Date(s.saleDate) <= end);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      sales = sales.filter(s =>
        s.saleNumber.toLowerCase().includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q))
      );
    }

    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);

    res.json({
      success: true,
      count: sales.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      sales,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error fetching sales' });
  }
});

// GET /api/sales/:id
router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const sale = db.sales.findById(req.params.id);
  if (!sale) {
    res.status(404).json({ success: false, message: 'Sale record not found.' });
    return;
  }

  res.json({ success: true, sale });
});

// POST /api/sales
router.post('/', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const { customerName, products, notes = '', saleDate } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      res.status(400).json({ success: false, message: 'At least one product line item is required.' });
      return;
    }

    // 1. Stock availability validation: verify each product has enough currentStock
    for (const item of products) {
      const product = db.products.findById(item.productId);
      if (!product) {
        res.status(404).json({ success: false, message: `Product with ID '${item.productId}' not found.` });
        return;
      }
      const requestedQty = Number(item.quantity) || 1;
      if (requestedQty <= 0) {
        res.status(400).json({ success: false, message: `Quantity for '${product.name}' must be greater than zero.` });
        return;
      }
      if (product.currentStock < requestedQty) {
        res.status(400).json({
          success: false,
          message: `Cannot complete sale! Insufficient stock for '${product.name}'. Available: ${product.currentStock}, Requested: ${requestedQty}.`,
        });
        return;
      }
    }

    // 2. All products have enough stock! Process line items and reduce stock
    let totalAmount = 0;
    const validatedProducts = [];
    const count = db.data.sales.length + 90;
    const saleNumber = `SO-2026-0${count}`;

    for (const item of products) {
      const product = db.products.findById(item.productId)!;
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice !== undefined ? item.unitPrice : product.sellingPrice);
      const lineTotal = Number((qty * unitPrice).toFixed(2));
      totalAmount += lineTotal;

      validatedProducts.push({
        productId: product._id,
        productName: product.name,
        quantity: qty,
        unitPrice,
        total: lineTotal,
      });

      // Reduce product stock
      const newStock = product.currentStock - qty;
      db.products.findByIdAndUpdate(product._id, { currentStock: newStock });

      // Create Stock Movement record
      db.stockMovements.create({
        productId: product._id,
        warehouseId: product.warehouseId,
        movementType: 'Stock Out',
        quantity: qty,
        reason: `Sales Order ${saleNumber}${customerName ? ` (${customerName})` : ''}`,
        performedBy: req.user?.name || 'Sales Staff',
      });

      // Check for low stock notification
      if (newStock <= product.minimumStock) {
        db.notifications.create({
          title: newStock === 0 ? 'Out of Stock Alert' : 'Low Stock Warning',
          message: `${product.name} is now at ${newStock} units following sale ${saleNumber}.`,
          type: newStock === 0 ? 'out_of_stock' : 'low_stock',
          isRead: false,
          link: '/products',
        });
      }
    }

    // 3. Create Sale Record
    const newSale = db.sales.create({
      saleNumber,
      customerName: customerName?.trim() || 'Walk-in / Direct Client',
      products: validatedProducts,
      totalAmount: Number(totalAmount.toFixed(2)),
      saleDate: saleDate || new Date().toISOString(),
      createdBy: req.user?.name || 'Staff User',
      notes,
    });

    res.status(201).json({
      success: true,
      message: `Sale ${newSale.saleNumber} recorded successfully! Total: $${newSale.totalAmount.toLocaleString()}.`,
      sale: newSale,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error processing sale' });
  }
});

export default router;
