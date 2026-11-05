import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticate, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/reports/monthly-sales
router.get('/monthly-sales', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const sales = db.sales.find();
    const products = db.products.find();

    const monthlyMap: Record<string, { month: string; revenue: number; cost: number; profit: number; orderCount: number }> = {};

    sales.forEach(sale => {
      const d = new Date(sale.saleDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap[key]) {
        monthlyMap[key] = { month: key, revenue: 0, cost: 0, profit: 0, orderCount: 0 };
      }

      monthlyMap[key].revenue += sale.totalAmount;
      monthlyMap[key].orderCount += 1;

      // Calculate cost
      let saleCost = 0;
      sale.products.forEach(item => {
        const prod = products.find(p => p._id === item.productId);
        const costPrice = prod ? prod.purchasePrice : 0;
        saleCost += (costPrice * item.quantity);
      });

      monthlyMap[key].cost += saleCost;
      monthlyMap[key].profit += (sale.totalAmount - saleCost);
    });

    const report = Object.values(monthlyMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(r => ({
        ...r,
        revenue: Number(r.revenue.toFixed(2)),
        cost: Number(r.cost.toFixed(2)),
        profit: Number(r.profit.toFixed(2)),
        margin: r.revenue > 0 ? `${Math.round((r.profit / r.revenue) * 100)}%` : '0%',
      }));

    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error generating sales report' });
  }
});

// GET /api/reports/inventory-valuation
router.get('/inventory-valuation', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const products = db.products.find();
    const warehouses = db.warehouses.find();

    const valuationByWarehouse = warehouses.map(w => {
      const prods = products.filter(p => p.warehouseId === w._id);
      const units = prods.reduce((sum, p) => sum + p.currentStock, 0);
      const costValue = prods.reduce((sum, p) => sum + (p.currentStock * p.purchasePrice), 0);
      const retailValue = prods.reduce((sum, p) => sum + (p.currentStock * p.sellingPrice), 0);
      const potentialProfit = retailValue - costValue;

      return {
        warehouseId: w._id,
        warehouseName: w.name,
        code: w.warehouseCode,
        skuCount: prods.length,
        totalUnits: units,
        totalCostValue: Number(costValue.toFixed(2)),
        totalRetailValue: Number(retailValue.toFixed(2)),
        potentialProfit: Number(potentialProfit.toFixed(2)),
      };
    });

    const totalCost = valuationByWarehouse.reduce((s, w) => s + w.totalCostValue, 0);
    const totalRetail = valuationByWarehouse.reduce((s, w) => s + w.totalRetailValue, 0);

    res.json({
      success: true,
      totals: {
        totalCostValue: Number(totalCost.toFixed(2)),
        totalRetailValue: Number(totalRetail.toFixed(2)),
        potentialProfit: Number((totalRetail - totalCost).toFixed(2)),
      },
      valuationByWarehouse,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error generating valuation report' });
  }
});

// GET /api/reports/product-performance
router.get('/product-performance', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const products = db.products.find();
    const sales = db.sales.find();

    const performanceMap: Record<string, { unitsSold: number; revenue: number }> = {};
    sales.forEach(sale => {
      sale.products.forEach(p => {
        if (!performanceMap[p.productId]) {
          performanceMap[p.productId] = { unitsSold: 0, revenue: 0 };
        }
        performanceMap[p.productId].unitsSold += p.quantity;
        performanceMap[p.productId].revenue += p.total;
      });
    });

    const report = products.map(p => {
      const sold = performanceMap[p._id]?.unitsSold || 0;
      const revenue = performanceMap[p._id]?.revenue || 0;
      const costOfGoodsSold = sold * p.purchasePrice;
      const grossProfit = revenue - costOfGoodsSold;
      const profitMargin = revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0;
      const currentStockValue = Number((p.currentStock * p.purchasePrice).toFixed(2));

      return {
        productId: p._id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        currentStock: p.currentStock,
        currentStockValue,
        unitsSold: sold,
        revenue: Number(revenue.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        profitMargin: `${profitMargin}%`,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    res.json({ success: true, count: report.length, report });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error generating performance report' });
  }
});

// GET /api/reports/supplier-performance
router.get('/supplier-performance', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const suppliers = db.suppliers.find();
    const purchaseOrders = db.purchaseOrders.find();

    const report = suppliers.map(s => {
      const pos = purchaseOrders.filter(po => po.supplierId === s._id);
      const completed = pos.filter(po => po.status === 'Received');
      const totalSpend = completed.reduce((sum, po) => sum + po.totalAmount, 0);

      let delayedCount = 0;
      let totalDelayDays = 0;
      completed.forEach(po => {
        if (po.expectedDeliveryDate && po.actualDeliveryDate) {
          const exp = new Date(po.expectedDeliveryDate).getTime();
          const act = new Date(po.actualDeliveryDate).getTime();
          const delay = Math.round((act - exp) / (1000 * 60 * 60 * 24));
          if (delay > 0) {
            delayedCount += 1;
            totalDelayDays += delay;
          }
        }
      });

      const onTimeRate = completed.length > 0 ? Math.round(((completed.length - delayedCount) / completed.length) * 100) : 100;
      const avgDelay = completed.length > 0 ? Number((totalDelayDays / completed.length).toFixed(1)) : 0;

      return {
        supplierId: s._id,
        supplierName: s.name,
        companyName: s.companyName,
        paymentTerms: s.paymentTerms,
        totalOrders: pos.length,
        receivedOrders: completed.length,
        totalSpend: Number(totalSpend.toFixed(2)),
        onTimeRate: `${onTimeRate}%`,
        avgDelayDays: avgDelay,
      };
    });

    res.json({ success: true, count: report.length, report });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error generating supplier report' });
  }
});

export default router;
