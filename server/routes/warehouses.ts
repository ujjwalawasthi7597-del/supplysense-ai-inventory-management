import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/warehouses
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const warehouses = db.warehouses.find();
    const products = db.products.find();

    const enriched = warehouses.map(w => {
      const storedProducts = products.filter(p => p.warehouseId === w._id);
      const totalUnits = storedProducts.reduce((sum, p) => sum + p.currentStock, 0);
      const totalValuation = storedProducts.reduce((sum, p) => sum + (p.currentStock * p.purchasePrice), 0);

      return {
        ...w,
        productCount: storedProducts.length,
        totalUnits,
        totalValuation: Number(totalValuation.toFixed(2)),
      };
    });

    res.json({ success: true, warehouses: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error fetching warehouses' });
  }
});

// GET /api/warehouses/:id
router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const warehouse = db.warehouses.findById(req.params.id);
  if (!warehouse) {
    res.status(404).json({ success: false, message: 'Warehouse not found.' });
    return;
  }

  const storedProducts = db.products.find({ warehouseId: warehouse._id });
  const totalValuation = storedProducts.reduce((sum, p) => sum + (p.currentStock * p.purchasePrice), 0);
  const totalUnits = storedProducts.reduce((sum, p) => sum + p.currentStock, 0);

  res.json({
    success: true,
    warehouse: {
      ...warehouse,
      productCount: storedProducts.length,
      totalUnits,
      totalValuation: Number(totalValuation.toFixed(2)),
      products: storedProducts,
    },
  });
});

// POST /api/warehouses
router.post('/', authenticate, requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const { name, warehouseCode, location, managerName, contactNumber, description } = req.body;

    if (!name || !warehouseCode || !location) {
      res.status(400).json({ success: false, message: 'Warehouse name, code, and location are required.' });
      return;
    }

    const existing = db.warehouses.findOne({ warehouseCode: warehouseCode.toUpperCase().trim() });
    if (existing) {
      res.status(400).json({ success: false, message: `Warehouse code '${warehouseCode}' is already in use.` });
      return;
    }

    const newWarehouse = db.warehouses.create({
      name: name.trim(),
      warehouseCode: warehouseCode.toUpperCase().trim(),
      location: location.trim(),
      managerName: managerName?.trim() || '',
      contactNumber: contactNumber?.trim() || '',
      description: description?.trim() || '',
    });

    res.status(201).json({ success: true, warehouse: newWarehouse });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error creating warehouse' });
  }
});

// PUT /api/warehouses/:id
router.put('/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const warehouse = db.warehouses.findById(req.params.id);
    if (!warehouse) {
      res.status(404).json({ success: false, message: 'Warehouse not found.' });
      return;
    }

    const { name, warehouseCode, location, managerName, contactNumber, description } = req.body;

    if (warehouseCode && warehouseCode.toUpperCase().trim() !== warehouse.warehouseCode) {
      const existing = db.warehouses.findOne({ warehouseCode: warehouseCode.toUpperCase().trim() });
      if (existing) {
        res.status(400).json({ success: false, message: `Warehouse code '${warehouseCode}' is already in use.` });
        return;
      }
    }

    const updated = db.warehouses.findByIdAndUpdate(warehouse._id, {
      ...(name ? { name: name.trim() } : {}),
      ...(warehouseCode ? { warehouseCode: warehouseCode.toUpperCase().trim() } : {}),
      ...(location ? { location: location.trim() } : {}),
      ...(managerName !== undefined ? { managerName: managerName.trim() } : {}),
      ...(contactNumber !== undefined ? { contactNumber: contactNumber.trim() } : {}),
      ...(description !== undefined ? { description: description.trim() } : {}),
    });

    res.json({ success: true, warehouse: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error updating warehouse' });
  }
});

// DELETE /api/warehouses/:id
router.delete('/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const warehouse = db.warehouses.findById(req.params.id);
    if (!warehouse) {
      res.status(404).json({ success: false, message: 'Warehouse not found.' });
      return;
    }

    // Check if it has any associated stock
    const productsWithStock = db.products.find().filter(p => p.warehouseId === warehouse._id && p.currentStock > 0);
    if (productsWithStock.length > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete warehouse '${warehouse.name}'. There are ${productsWithStock.length} products with active stock located here. Reallocate or clear stock first.`,
      });
      return;
    }

    db.warehouses.findByIdAndDelete(warehouse._id);
    res.json({ success: true, message: `Warehouse '${warehouse.name}' deleted successfully.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error deleting warehouse' });
  }
});

export default router;
