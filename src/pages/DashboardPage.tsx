import React, { useState, useEffect } from 'react';
import {
  Package,
  Boxes,
  Warehouse,
  Truck,
  FileSpreadsheet,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  DollarSign,
  Plus,
  RefreshCw,
  Sparkles,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { api } from '../services/api.ts';
import { StockBadge, POBadge } from '../components/common/Badge.tsx';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ovRes, salesRes, invRes] = await Promise.all([
        api.dashboard.getOverview(),
        api.dashboard.getSales(),
        api.dashboard.getInventory(),
      ]);

      if (ovRes.success) setOverview(ovRes);
      if (salesRes.success) setSalesData(salesRes);
      if (invRes.success) setInventoryData(invRes);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err?.message || 'Failed to fetch dashboard records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !overview) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold">Aggregating live MongoDB inventory metrics...</p>
      </div>
    );
  }

  const stats = overview?.stats || {
    totalProducts: 0,
    totalInventoryValue: 0,
    totalWarehouses: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalSuppliers: 0,
    pendingPurchaseOrders: 0,
  };

  const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Inventory & Operations Hub</h2>
          <p className="text-xs text-slate-500">
            Real-time status across all regional warehouses, procurement streams, and active sales.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigate('sales')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Record Sale</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('inventory')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1.5"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Stock In / Out</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('purchase-orders')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Purchase Order</span>
          </button>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Statistic Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Products */}
        <div
          onClick={() => onNavigate('products')}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Products</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.totalProducts}</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              Active SKUs
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">In 4 primary categories</p>
        </div>

        {/* Card 2: Inventory Value */}
        <div
          onClick={() => onNavigate('reports')}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Inventory Value</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              ${stats.totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">At current cost basis</p>
        </div>

        {/* Card 3: Low & Out of Stock */}
        <div
          onClick={() => onNavigate('products')}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Stock Alerts</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600">{stats.lowStockCount} Low</span>
            <span className="text-xs font-bold text-rose-600">/ {stats.outOfStockCount} Out</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Requires purchasing attention</p>
        </div>

        {/* Card 4: Pending POs & Warehouses */}
        <div
          onClick={() => onNavigate('purchase-orders')}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Orders</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.pendingPurchaseOrders}</span>
            <span className="text-xs font-semibold text-blue-600">POs Awaiting Approval</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{stats.totalSuppliers} verified suppliers</p>
        </div>
      </div>

      {/* AI Assistant Callout Pill */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-blue-950/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-blue-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Gemini AI Demand Intelligence Active</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200">Live Forecasting</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Identified 4 reorder recommendations with auto-calculated replenishment quantities to avoid stock-outs.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('ai-insights')}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-blue-900 hover:bg-blue-50 transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-sm"
        >
          <span>View AI Predictions</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Visualizations Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Monthly Sales Revenue Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Sales Revenue</h3>
              <p className="text-xs text-slate-400">Recorded order volume across previous months</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              USD ($)
            </span>
          </div>

          <div className="h-64 w-full">
            {salesData?.monthlySalesChart?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData.monthlySalesChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No monthly sales history found.
              </div>
            )}
          </div>
        </div>

        {/* Warehouse Inventory Distribution (1 col) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Stock By Warehouse</h3>
              <p className="text-xs text-slate-400">Inventory valuation share</p>
            </div>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            {inventoryData?.warehouseDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryData.warehouseDistribution}
                    dataKey="value"
                    nameKey="code"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {inventoryData.warehouseDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Valuation']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No warehouse stock data</div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-3 space-y-1.5 max-h-24 overflow-y-auto">
            {inventoryData?.warehouseDistribution?.map((item: any, idx: number) => (
              <div key={item.code} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="font-medium text-slate-700">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">${item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row: Low Stock Alerts & Top Selling Products */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Low Stock & Depletion Warnings</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Manage SKUs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Warehouse</th>
                  <th className="pb-2 text-center">Stock / Min</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {overview?.alerts?.length > 0 ? (
                  overview.alerts.slice(0, 5).map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 font-semibold text-slate-900">
                        {item.name}
                        <span className="block text-[10px] text-slate-400 font-mono">{item.sku}</span>
                      </td>
                      <td className="py-2.5 text-slate-600">{item.warehouseName}</td>
                      <td className="py-2.5 text-center font-bold">
                        <span className={item.currentStock === 0 ? 'text-rose-600' : 'text-amber-600'}>
                          {item.currentStock}
                        </span>
                        <span className="text-slate-400 font-normal"> / {item.minimumStock}</span>
                      </td>
                      <td className="py-2.5 text-right">
                        <StockBadge status={item.currentStock === 0 ? 'Out of Stock' : 'Low Stock'} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-slate-400">
                      All products currently have healthy inventory levels.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900">Top Performing Products</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('sales')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View Sales
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-2">Product Name</th>
                  <th className="pb-2 text-center">Units Sold</th>
                  <th className="pb-2 text-right">Gross Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {salesData?.topSellingProducts?.length > 0 ? (
                  salesData.topSellingProducts.map((p: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 font-semibold text-slate-900">
                        {p.name}
                        <span className="block text-[10px] text-slate-400 font-mono">{p.sku}</span>
                      </td>
                      <td className="py-2.5 text-center font-bold text-slate-700">{p.unitsSold} units</td>
                      <td className="py-2.5 text-right font-extrabold text-slate-900">${p.revenue.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-xs text-slate-400">
                      No sales recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Activity: Stock Movements & Recent Purchase Orders */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Stock Movements */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Recent Stock Movements</h3>
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Full Movement Log
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {overview?.recentMovements?.length > 0 ? (
              overview.recentMovements.map((m: any) => (
                <div key={m._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">{m.productName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {m.reason} • <span className="font-medium text-slate-600">{m.performedBy}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-extrabold px-2 py-0.5 rounded-md text-[11px] ${
                        m.movementType === 'Stock In'
                          ? 'bg-emerald-50 text-emerald-700'
                          : m.movementType === 'Stock Out'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity} units ({m.movementType})
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-xs text-slate-400">No stock movements recorded.</p>
            )}
          </div>
        </div>

        {/* Recent Purchase Orders */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Recent Purchase Orders</h3>
            <button
              type="button"
              onClick={() => onNavigate('purchase-orders')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              All Orders
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {overview?.recentPurchaseOrders?.length > 0 ? (
              overview.recentPurchaseOrders.map((po: any) => (
                <div key={po._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono">{po.poNumber}</span>
                      <POBadge status={po.status} />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {po.supplierName} • {po.products?.length || 0} line items
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-slate-900 text-xs">
                      ${po.totalAmount.toLocaleString()}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Ordered: {new Date(po.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-xs text-slate-400">No purchase orders found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
