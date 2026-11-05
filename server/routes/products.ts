import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// Helper to determine stock status
function getStockStatus(currentStock: number, minimumStock: number): 'Out of Stock' | 'Low Stock' | 'In Stock' {
  if (currentStock <= 0) return 'Out of Stock';
  if (currentStock <= minimumStock) return 'Low Stock';
  return 'In Stock';
}

// GET /api/products
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const { search, category, warehouseId, stockStatus, sortBy } = req.query;

    let products = db.products.find();

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    if (category && typeof category === 'string' && category !== 'All') {
      products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (warehouseId && typeof warehouseId === 'string' && warehouseId !== 'All') {
      products = products.filter(p => p.warehouseId === warehouseId);
    }

    // Attach computed stockStatus and details
    let enhanced = products.map(p => {
      const warehouse = db.warehouses.findById(p.warehouseId);
      const supplier = db.suppliers.findById(p.supplierId);
      const status = getStockStatus(p.currentStock, p.minimumStock);
      return {
        ...p,
        stockStatus: status,
        warehouseName: warehouse?.name || 'Unknown',
        warehouseCode: warehouse?.warehouseCode || '',
        supplierName: supplier?.companyName || supplier?.name || 'Unknown',
      };
    });

    if (stockStatus && typeof stockStatus === 'string' && stockStatus !== 'All') {
      enhanced = enhanced.filter(p => p.stockStatus.toLowerCase() === (stockStatus as string).toLowerCase());
    }

    // Sorting
    if (sortBy === 'stock_asc') {
      enhanced.sort((a, b) => a.currentStock - b.currentStock);
    } else if (sortBy === 'stock_desc') {
      enhanced.sort((a, b) => b.currentStock - a.currentStock);
    } else if (sortBy === 'price_asc') {
      enhanced.sort((a, b) => a.sellingPrice - b.sellingPrice);
    } else if (sortBy === 'price_desc') {
      enhanced.sort((a, b) => b.sellingPrice - a.sellingPrice);
    } else if (sortBy === 'name_desc') {
      enhanced.sort((a, b) => b.name.localeCompare(a.name));
    } else {
      // Default: name asc or recent
      enhanced.sort((a, b) => a.name.localeCompare(b.name));
    }

    res.json({ success: true, count: enhanced.length, products: enhanced });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error fetching products' });
  }
});

// GET /api/products/:id
router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const product = db.products.findById(req.params.id);
  if (!product) {
    res.status(404).json({ success: false, message: 'Product not found.' });
    return;
  }

  const warehouse = db.warehouses.findById(product.warehouseId);
  const supplier = db.suppliers.findById(product.supplierId);
  const movements = db.stockMovements.find({ productId: product._id }).slice(0, 10);

  res.json({
    success: true,
    product: {
      ...product,
      stockStatus: getStockStatus(product.currentStock, product.minimumStock),
      warehouse,
      supplier,
      recentMovements: movements,
    },
  });
});

// POST /api/products
router.post('/', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const {
      name,
      sku,
      category,
      description = '',
      image,
      purchasePrice,
      sellingPrice,
      currentStock = 0,
      minimumStock = 5,
      warehouseId,
      supplierId,
    } = req.body;

    if (!name || !sku || !category || purchasePrice === undefined || sellingPrice === undefined || !warehouseId || !supplierId) {
      res.status(400).json({ success: false, message: 'Name, SKU, category, prices, warehouse, and supplier are required.' });
      return;
    }

    // Check SKU uniqueness
    const existing = db.products.findOne({ sku: sku.toUpperCase().trim() });
    if (existing) {
      res.status(400).json({ success: false, message: `SKU '${sku}' is already in use by another product.` });
      return;
    }

    const warehouse = db.warehouses.findById(warehouseId);
    if (!warehouse) {
      res.status(400).json({ success: false, message: 'Selected warehouse does not exist.' });
      return;
    }

    const supplier = db.suppliers.findById(supplierId);
    if (!supplier) {
      res.status(400).json({ success: false, message: 'Selected supplier does not exist.' });
      return;
    }

    const stockQty = Math.max(0, Number(currentStock));

    const newProduct = db.products.create({
      name: name.trim(),
      sku: sku.toUpperCase().trim(),
      category: category.trim(),
      description: description.trim(),
      image: image || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=80',
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      currentStock: stockQty,
      minimumStock: Math.max(0, Number(minimumStock)),
      warehouseId,
      supplierId,
    });

    // If initial stock is greater than 0, record initial stock movement
    if (stockQty > 0) {
      db.stockMovements.create({
        productId: newProduct._id,
        warehouseId,
        movementType: 'Stock In',
        quantity: stockQty,
        reason: 'Initial stock intake upon product creation',
        performedBy: req.user?.name || 'System User',
      });
    }

    // Check if low stock
    if (stockQty <= Number(minimumStock)) {
      db.notifications.create({
        title: stockQty === 0 ? 'Out of Stock Alert' : 'Low Stock Warning',
        message: `${newProduct.name} (${newProduct.sku}) created with ${stockQty} units (min: ${minimumStock}).`,
        type: stockQty === 0 ? 'out_of_stock' : 'low_stock',
        isRead: false,
        link: '/products',
      });
    }

    res.status(201).json({ success: true, product: newProduct });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error creating product' });
  }
});

// PUT /api/products/:id
router.put('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const product = db.products.findById(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    const {
      name,
      sku,
      category,
      description,
      image,
      purchasePrice,
      sellingPrice,
      minimumStock,
      warehouseId,
      supplierId,
    } = req.body;

    if (sku && sku.toUpperCase().trim() !== product.sku) {
      const existing = db.products.findOne({ sku: sku.toUpperCase().trim() });
      if (existing) {
        res.status(400).json({ success: false, message: `SKU '${sku}' is already in use by another product.` });
        return;
      }
    }

    const updated = db.products.findByIdAndUpdate(product._id, {
      ...(name ? { name: name.trim() } : {}),
      ...(sku ? { sku: sku.toUpperCase().trim() } : {}),
      ...(category ? { category: category.trim() } : {}),
      ...(description !== undefined ? { description: description.trim() } : {}),
      ...(image ? { image: image.trim() } : {}),
      ...(purchasePrice !== undefined ? { purchasePrice: Number(purchasePrice) } : {}),
      ...(sellingPrice !== undefined ? { sellingPrice: Number(sellingPrice) } : {}),
      ...(minimumStock !== undefined ? { minimumStock: Number(minimumStock) } : {}),
      ...(warehouseId ? { warehouseId } : {}),
      ...(supplierId ? { supplierId } : {}),
    });

    res.json({ success: true, product: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error updating product' });
  }
});

// DELETE /api/products/:id (Admin only)
router.delete('/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const product = db.products.findById(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    // Check if open purchase orders reference this product
    const openOrders = db.purchaseOrders.find().filter(
      po => (po.status === 'Ordered' || po.status === 'Approved' || po.status === 'Pending Approval') &&
      po.products.some(item => item.productId === product._id)
    );

    if (openOrders.length > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete product '${product.name}' because it is part of active Purchase Order ${openOrders[0].poNumber}.`,
      });
      return;
    }

    db.products.findByIdAndDelete(product._id);
    res.json({ success: true, message: `Product '${product.name}' deleted successfully.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error deleting product' });
  }
});

export default router;
