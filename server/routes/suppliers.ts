import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/suppliers
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const suppliers = db.suppliers.find();
    const products = db.products.find();
    const purchaseOrders = db.purchaseOrders.find();

    const enriched = suppliers.map(s => {
      const suppliedProducts = products.filter(p => p.supplierId === s._id);
      const orders = purchaseOrders.filter(po => po.supplierId === s._id);
      const totalSpend = orders
        .filter(po => po.status === 'Received')
        .reduce((sum, po) => sum + po.totalAmount, 0);

      return {
        ...s,
        productsCount: suppliedProducts.length,
        totalOrdersCount: orders.length,
        totalDeliveredSpend: Number(totalSpend.toFixed(2)),
      };
    });

    res.json({ success: true, suppliers: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error fetching suppliers' });
  }
});

// GET /api/suppliers/:id
router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const supplier = db.suppliers.findById(req.params.id);
  if (!supplier) {
    res.status(404).json({ success: false, message: 'Supplier not found.' });
    return;
  }

  const suppliedProducts = db.products.find({ supplierId: supplier._id });
  const purchaseOrders = db.purchaseOrders.find({ supplierId: supplier._id });

  res.json({
    success: true,
    supplier: {
      ...supplier,
      products: suppliedProducts,
      purchaseOrders,
    },
  });
});

// POST /api/suppliers
router.post('/', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const { name, companyName, email, phone, address, paymentTerms } = req.body;

    if (!name || !companyName || !email) {
      res.status(400).json({ success: false, message: 'Supplier contact name, company name, and email are required.' });
      return;
    }

    const newSupplier = db.suppliers.create({
      name: name.trim(),
      companyName: companyName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || '',
      address: address?.trim() || '',
      paymentTerms: paymentTerms?.trim() || 'Net 30',
    });

    res.status(201).json({ success: true, supplier: newSupplier });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error creating supplier' });
  }
});

// PUT /api/suppliers/:id
router.put('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const supplier = db.suppliers.findById(req.params.id);
    if (!supplier) {
      res.status(404).json({ success: false, message: 'Supplier not found.' });
      return;
    }

    const { name, companyName, email, phone, address, paymentTerms } = req.body;

    const updated = db.suppliers.findByIdAndUpdate(supplier._id, {
      ...(name ? { name: name.trim() } : {}),
      ...(companyName ? { companyName: companyName.trim() } : {}),
      ...(email ? { email: email.toLowerCase().trim() } : {}),
      ...(phone !== undefined ? { phone: phone.trim() } : {}),
      ...(address !== undefined ? { address: address.trim() } : {}),
      ...(paymentTerms !== undefined ? { paymentTerms: paymentTerms.trim() } : {}),
    });

    res.json({ success: true, supplier: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error updating supplier' });
  }
});

// DELETE /api/suppliers/:id
router.delete('/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const supplier = db.suppliers.findById(req.params.id);
    if (!supplier) {
      res.status(404).json({ success: false, message: 'Supplier not found.' });
      return;
    }

    // Check dependent purchase orders
    const activeOrders = db.purchaseOrders.find({ supplierId: supplier._id }).filter(
      po => po.status === 'Ordered' || po.status === 'Approved' || po.status === 'Pending Approval'
    );

    if (activeOrders.length > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete supplier '${supplier.companyName}'. There are ${activeOrders.length} active purchase orders linked to this supplier.`,
      });
      return;
    }

    db.suppliers.findByIdAndDelete(supplier._id);
    res.json({ success: true, message: `Supplier '${supplier.companyName}' deleted successfully.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error deleting supplier' });
  }
});

export default router;
