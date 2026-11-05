import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Package,
  Truck,
  Warehouse,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { api } from '../services/api.ts';

export const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'sales' | 'valuation' | 'products' | 'suppliers'>('sales');
  const [loading, setLoading] = useState(false);

  const [salesReport, setSalesReport] = useState<any[]>([]);
  const [valuationReport, setValuationReport] = useState<any>(null);
  const [productReport, setProductReport] = useState<any[]>([]);
  const [supplierReport, setSupplierReport] = useState<any[]>([]);

  const loadReport = async (type: string) => {
    setLoading(true);
    try {
      if (type === 'sales') {
        const res = await api.reports.monthlySales();
        if (res.success) setSalesReport(res.report);
      } else if (type === 'valuation') {
        const res = await api.reports.inventoryValuation();
        if (res.success) setValuationReport(res);
      } else if (type === 'products') {
        const res = await api.reports.productPerformance();
        if (res.success) setProductReport(res.report);
      } else if (type === 'suppliers') {
        const res = await api.reports.supplierPerformance();
        if (res.success) setSupplierReport(res.report);
      }
    } catch (err: any) {
      console.error('Error loading report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(activeReport);
  }, [activeReport]);

  const handleExportCSV = () => {
    let rows: any[] = [];
    let filename = `supplysense_${activeReport}_report.csv`;

    if (activeReport === 'sales') {
      rows = salesReport;
    } else if (activeReport === 'valuation') {
      rows = valuationReport?.valuationByWarehouse || [];
    } else if (activeReport === 'products') {
      rows = productReport;
    } else if (activeReport === 'suppliers') {
      rows = supplierReport;
    }

    if (rows.length === 0) return;

    const headers = Object.keys(rows[0]).join(',');
    const csvContent = [headers, ...rows.map(r => Object.values(r).map(val => `"${val}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Financial & Operational Reports</h2>
          <p className="text-xs text-slate-500">
            Real-time calculations of gross profit margins, inventory asset valuations, and vendor performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveReport('sales')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeReport === 'sales'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Monthly Sales & Margins</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('valuation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeReport === 'valuation'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Inventory Asset Valuation</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeReport === 'products'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Product Margin Performance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('suppliers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeReport === 'suppliers'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Supplier SLA & Spend Report</span>
        </button>
      </div>

      {/* Report 1: Monthly Sales & Profitability */}
      {activeReport === 'sales' && (
        <div className="space-y-6">
          {/* Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Monthly Gross Revenue vs Cost of Goods Sold</h3>
            <p className="text-xs text-slate-400 mb-4">Calculated from actual recorded orders and product cost basis</p>

            <div className="h-64 w-full">
              {salesReport.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesReport} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="revenue" fill="#2563eb" name="Revenue ($)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" fill="#10b981" name="Gross Profit ($)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Loading monthly sales trends...
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Period (Month)</th>
                    <th className="py-3 px-4 text-center">Orders Fulfilled</th>
                    <th className="py-3 px-4 text-right">Gross Revenue</th>
                    <th className="py-3 px-4 text-right">Cost Basis (COGS)</th>
                    <th className="py-3 px-4 text-right">Gross Profit</th>
                    <th className="py-3 px-4 text-right">Profit Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {salesReport.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{r.month}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">{r.orderCount} orders</td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">${r.revenue.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-500">${r.cost.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">${r.profit.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600">{r.margin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report 2: Inventory Valuation */}
      {activeReport === 'valuation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Cost Basis Value</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                ${(valuationReport?.totals?.totalCostValue || 0).toLocaleString()}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Capital invested in physical inventory</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Retail / Selling Value</span>
              <span className="text-2xl font-extrabold text-blue-600 mt-1 block">
                ${(valuationReport?.totals?.totalRetailValue || 0).toLocaleString()}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">At full MSRP catalog value</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Unrealized Gross Margin</span>
              <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
                ${(valuationReport?.totals?.potentialProfit || 0).toLocaleString()}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Net profit upon complete sell-through</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Facility Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Warehouse</th>
                    <th className="py-3 px-4 text-center">SKU Count</th>
                    <th className="py-3 px-4 text-center">Total Units</th>
                    <th className="py-3 px-4 text-right">Cost Valuation</th>
                    <th className="py-3 px-4 text-right">Retail Valuation</th>
                    <th className="py-3 px-4 text-right">Potential Gross Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {valuationReport?.valuationByWarehouse?.map((w: any) => (
                    <tr key={w.warehouseId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {w.warehouseName}{' '}
                        <span className="font-mono text-[10px] text-slate-400">({w.code})</span>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-700">{w.skuCount} SKUs</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{w.totalUnits} units</td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">${w.totalCostValue.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-blue-600">${w.totalRetailValue.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">${w.potentialProfit.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report 3: Product Margin Performance */}
      {activeReport === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">SKU Profitability & Sales Velocity</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Units Sold</th>
                  <th className="py-3 px-4 text-right">Gross Revenue</th>
                  <th className="py-3 px-4 text-right">Gross Profit</th>
                  <th className="py-3 px-4 text-center">Profit Margin</th>
                  <th className="py-3 px-4 text-right">Current Asset Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {productReport.map(p => (
                  <tr key={p.productId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <span className="font-mono text-[10px] text-slate-400">{p.sku}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.category}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{p.unitsSold} units</td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">${p.revenue.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">${p.grossProfit.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                        {p.profitMargin}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">${p.currentStockValue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 4: Supplier Performance */}
      {activeReport === 'suppliers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Supplier Order Fulfillment & Spend Analysis</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Supplier Company</th>
                  <th className="py-3 px-4">Payment Terms</th>
                  <th className="py-3 px-4 text-center">Total POs</th>
                  <th className="py-3 px-4 text-center">Received POs</th>
                  <th className="py-3 px-4 text-right">Total Procurement Spend</th>
                  <th className="py-3 px-4 text-center">On-Time Delivery Rate</th>
                  <th className="py-3 px-4 text-center">Average Lead-Time Delay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {supplierReport.map(s => (
                  <tr key={s.supplierId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.companyName}</td>
                    <td className="py-3 px-4 text-slate-600">{s.paymentTerms}</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-700">{s.totalOrders}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{s.receivedOrders}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">${s.totalSpend.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center font-extrabold text-emerald-600">{s.onTimeRate}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {s.avgDelayDays > 0 ? `+${s.avgDelayDays} days` : '0 days (On Schedule)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
