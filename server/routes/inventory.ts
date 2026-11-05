import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticate, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/inventory
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const products = db.products.find();
    const warehouses = db.warehouses.find();

    const warehouseBreakdown = warehouses.map(w => {
      const items = products.filter(p => p.warehouseId === w._id);
      const totalUnits = items.reduce((acc, p) => acc + p.currentStock, 0);
      const valuation = items.reduce((acc, p) => acc + (p.currentStock * p.purchasePrice), 0);
      const lowStockCount = items.filter(p => p.currentStock <= p.minimumStock).length;

      return {
        warehouseId: w._id,
        warehouseName: w.name,
        warehouseCode: w.warehouseCode,
        location: w.location,
        totalUnits,
        totalValuation: Number(valuation.toFixed(2)),
        productCount: items.length,
        lowStockCount,
      };
    });

    const totalStock = products.reduce((acc, p) => acc + p.currentStock, 0);
    const totalValuation = products.reduce((acc, p) => acc + (p.currentStock * p.purchasePrice), 0);
    const lowStockItems = products.filter(p => p.currentStock <= p.minimumStock && p.currentStock > 0);
    const outOfStockItems = products.filter(p => p.currentStock === 0);

    res.json({
      success: true,
      summary: {
        totalStock,
        totalValuation: Number(totalValuation.toFixed(2)),
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
      },
      warehouseBreakdown,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error fetching inventory' });
  }
});

// GET /api/inventory/movements
router.get('/movements', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const { productId, warehouseId, movementType } = req.query;

    const filter: any = {};
    if (productId && productId !== 'All') filter.productId = productId;
    if (warehouseId && warehouseId !== 'All') filter.warehouseId = warehouseId;
    if (movementType && movementType !== 'All') filter.movementType = movementType;

    const movements = db.stockMovements.find(filter);

    const enriched = movements.map(m => {
      const product = db.products.findById(m.productId);
      const warehouse = db.warehouses.findById(m.warehouseId);
      return {
        ...m,
        productName: product?.name || 'Unknown Product',
        productSku: product?.sku || '',
        warehouseName: warehouse?.name || 'Unknown Warehouse',
        warehouseCode: warehouse?.warehouseCode || '',
      };
    });

    res.json({ success: true, count: enriched.length, movements: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error fetching movements' });
  }
});

// POST /api/inventory/stock-in
router.post('/stock-in', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const { productId, warehouseId, quantity, reason } = req.body;

    if (!productId || !quantity || Number(quantity) <= 0) {
      res.status(400).json({ success: false, message: 'Valid product and positive quantity required.' });
      return;
    }

    const product = db.products.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    const targetWarehouseId = warehouseId || product.warehouseId;
    const qty = Number(quantity);
    const newStock = product.currentStock + qty;

    db.products.findByIdAndUpdate(product._id, { currentStock: newStock });

    const movement = db.stockMovements.create({
      productId: product._id,
      warehouseId: targetWarehouseId,
      movementType: 'Stock In',
      quantity: qty,
      reason: reason?.trim() || 'Manual stock intake',
      performedBy: req.user?.name || 'Authorized Staff',
    });

    res.json({
      success: true,
      message: `Successfully added ${qty} units to ${product.name}. Current stock: ${newStock}.`,
      movement,
      currentStock: newStock,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error processing stock-in' });
  }
});

// POST /api/inventory/stock-out
router.post('/stock-out', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const { productId, warehouseId, quantity, reason } = req.body;

    if (!productId || !quantity || Number(quantity) <= 0) {
      res.status(400).json({ success: false, message: 'Valid product and positive quantity required.' });
      return;
    }

    const product = db.products.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    const qty = Number(quantity);

    // Prevent negative inventory
    if (product.currentStock < qty) {
      res.status(400).json({
        success: false,
        message: `Insufficient stock! Cannot remove ${qty} units. Current available stock is ${product.currentStock} units.`,
      });
      return;
    }

    const newStock = product.currentStock - qty;
    db.products.findByIdAndUpdate(product._id, { currentStock: newStock });

    const targetWarehouseId = warehouseId || product.warehouseId;
    const movement = db.stockMovements.create({
      productId: product._id,
      warehouseId: targetWarehouseId,
      movementType: 'Stock Out',
      quantity: qty,
      reason: reason?.trim() || 'Manual stock removal',
      performedBy: req.user?.name || 'Authorized Staff',
    });

    // Low stock notification if reached threshold
    if (newStock <= product.minimumStock) {
      db.notifications.create({
        title: newStock === 0 ? 'Out of Stock Alert' : 'Low Stock Warning',
        message: `${product.name} (${product.sku}) is now at ${newStock} units (minimum: ${product.minimumStock}).`,
        type: newStock === 0 ? 'out_of_stock' : 'low_stock',
        isRead: false,
        link: '/products',
      });
    }

    res.json({
      success: true,
      message: `Successfully removed ${qty} units from ${product.name}. Remaining stock: ${newStock}.`,
      movement,
      currentStock: newStock,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error processing stock-out' });
  }
});

// POST /api/inventory/adjust
router.post('/adjust', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const { productId, warehouseId, newQuantity, reason } = req.body;

    if (!productId || newQuantity === undefined || Number(newQuantity) < 0) {
      res.status(400).json({ success: false, message: 'Product and non-negative target quantity required.' });
      return;
    }

    if (!reason || !reason.trim()) {
      res.status(400).json({ success: false, message: 'A reason for stock adjustment must be recorded.' });
      return;
    }

    const product = db.products.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    const targetQty = Number(newQuantity);
    const diff = targetQty - product.currentStock;

    if (diff === 0) {
      res.json({ success: true, message: 'Stock already at target quantity. No change recorded.' });
      return;
    }

    db.products.findByIdAndUpdate(product._id, { currentStock: targetQty });

    const targetWarehouseId = warehouseId || product.warehouseId;
    const movement = db.stockMovements.create({
      productId: product._id,
      warehouseId: targetWarehouseId,
      movementType: 'Adjustment',
      quantity: diff,
      reason: reason.trim(),
      performedBy: req.user?.name || 'Authorized Staff',
    });

    res.json({
      success: true,
      message: `Stock for ${product.name} adjusted from ${product.currentStock} to ${targetQty} (${diff > 0 ? '+' : ''}${diff}).`,
      movement,
      currentStock: targetQty,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error processing adjustment' });
  }
});

export default router;
