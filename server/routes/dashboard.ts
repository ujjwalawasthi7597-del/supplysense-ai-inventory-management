import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticate, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/dashboard/overview
router.get('/overview', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const products = db.products.find();
    const warehouses = db.warehouses.find();
    const suppliers = db.suppliers.find();
    const purchaseOrders = db.purchaseOrders.find();
    const stockMovements = db.stockMovements.find();
    const sales = db.sales.find();

    const totalProducts = products.length;
    const totalInventoryValue = products.reduce((acc, p) => acc + (p.currentStock * p.purchasePrice), 0);
    const totalWarehouses = warehouses.length;
    const lowStockProducts = products.filter(p => p.currentStock <= p.minimumStock && p.currentStock > 0);
    const outOfStockProducts = products.filter(p => p.currentStock === 0);
    const totalSuppliers = suppliers.length;
    const pendingPurchaseOrders = purchaseOrders.filter(po => po.status === 'Pending Approval').length;

    // Recent stock movements with product and warehouse names
    const recentMovements = stockMovements.slice(0, 6).map(m => {
      const prod = db.products.findById(m.productId);
      const wh = db.warehouses.findById(m.warehouseId);
      return {
        ...m,
        productName: prod?.name || 'Unknown',
        productSku: prod?.sku || '',
        warehouseName: wh?.name || 'Unknown',
      };
    });

    // Recent purchase orders with supplier name
    const recentPOs = purchaseOrders.slice(0, 5).map(po => {
      const sup = db.suppliers.findById(po.supplierId);
      const wh = db.warehouses.findById(po.warehouseId);
      return {
        ...po,
        supplierName: sup?.companyName || sup?.name || 'Unknown',
        warehouseName: wh?.name || 'Unknown',
      };
    });

    // Low stock alerts list
    const alerts = products
      .filter(p => p.currentStock <= p.minimumStock)
      .map(p => {
        const wh = db.warehouses.findById(p.warehouseId);
        const sup = db.suppliers.findById(p.supplierId);
        return {
          id: p._id,
          name: p.name,
          sku: p.sku,
          currentStock: p.currentStock,
          minimumStock: p.minimumStock,
          warehouseName: wh?.name || 'Main Warehouse',
          supplierName: sup?.companyName || 'Primary Supplier',
          isOutOfStock: p.currentStock === 0,
        };
      })
      .sort((a, b) => a.currentStock - b.currentStock);

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
        totalWarehouses,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        totalSuppliers,
        pendingPurchaseOrders,
        totalSalesCount: sales.length,
      },
      recentMovements,
      recentPurchaseOrders: recentPOs,
      alerts,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error fetching dashboard overview' });
  }
});

// GET /api/dashboard/sales
router.get('/sales', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const sales = db.sales.find();
    const products = db.products.find();

    // Group sales by month
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyStats: Record<string, { month: string; revenue: number; orders: number; unitsSold: number }> = {};

    // Generate last 6 months buckets
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyStats[key] = { month: key, revenue: 0, orders: 0, unitsSold: 0 };
    }

    // Populate from real sales records
    sales.forEach(sale => {
      const d = new Date(sale.saleDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyStats[key]) {
        monthlyStats[key].revenue += sale.totalAmount;
        monthlyStats[key].orders += 1;
        const units = sale.products.reduce((acc, p) => acc + p.quantity, 0);
        monthlyStats[key].unitsSold += units;
      }
    });

    const monthlySalesChart = Object.values(monthlyStats);

    // Top selling products by revenue
    const productSalesMap: Record<string, { name: string; sku: string; unitsSold: number; revenue: number }> = {};
    sales.forEach(s => {
      s.products.forEach(p => {
        if (!productSalesMap[p.productId]) {
          const prod = products.find(item => item._id === p.productId);
          productSalesMap[p.productId] = {
            name: prod?.name || p.productName || 'Product',
            sku: prod?.sku || '',
            unitsSold: 0,
            revenue: 0,
          };
        }
        productSalesMap[p.productId].unitsSold += p.quantity;
        productSalesMap[p.productId].revenue += p.total;
      });
    });

    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => ({
        ...p,
        revenue: Number(p.revenue.toFixed(2)),
      }));

    res.json({
      success: true,
      monthlySalesChart,
      topSellingProducts,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error fetching dashboard sales' });
  }
});

// GET /api/dashboard/inventory
router.get('/inventory', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const products = db.products.find();
    const warehouses = db.warehouses.find();

    // Inventory by warehouse
    const warehouseDistribution = warehouses.map(w => {
      const items = products.filter(p => p.warehouseId === w._id);
      const units = items.reduce((acc, p) => acc + p.currentStock, 0);
      const valuation = items.reduce((acc, p) => acc + (p.currentStock * p.purchasePrice), 0);
      return {
        name: w.name,
        code: w.warehouseCode,
        units,
        value: Number(valuation.toFixed(2)),
      };
    });

    // Inventory by category
    const categoryMap: Record<string, { name: string; count: number; units: number; value: number }> = {};
    products.forEach(p => {
      if (!categoryMap[p.category]) {
        categoryMap[p.category] = { name: p.category, count: 0, units: 0, value: 0 };
      }
      categoryMap[p.category].count += 1;
      categoryMap[p.category].units += p.currentStock;
      categoryMap[p.category].value += (p.currentStock * p.purchasePrice);
    });

    const categoryBreakdown = Object.values(categoryMap).map(c => ({
      ...c,
      value: Number(c.value.toFixed(2)),
    }));

    res.json({
      success: true,
      warehouseDistribution,
      categoryBreakdown,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error fetching inventory stats' });
  }
});

export default router;
