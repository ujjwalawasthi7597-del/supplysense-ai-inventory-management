import React, { useState, useEffect } from 'react';
import {
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  RefreshCw,
  Search,
  Filter,
  Warehouse,
  History,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Edit3,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { Product, Warehouse as WarehouseType, StockMovement } from '../types/index.ts';
import { Modal } from '../components/common/Modal.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export const InventoryPage: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for movement history
  const [filterType, setFilterType] = useState('All');
  const [filterProduct, setFilterProduct] = useState('All');
  const [filterWarehouse, setFilterWarehouse] = useState('All');

  // Modals
  const [activeModal, setActiveModal] = useState<'stock-in' | 'stock-out' | 'adjust' | null>(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ovRes, mvRes, prodRes, whRes] = await Promise.all([
        api.inventory.getOverview(),
        api.inventory.getMovements({
          movementType: filterType,
          productId: filterProduct,
          warehouseId: filterWarehouse,
        }),
        api.products.getAll(),
        api.warehouses.getAll(),
      ]);

      if (ovRes.success) setOverview(ovRes);
      if (mvRes.success) setMovements(mvRes.movements);
      if (prodRes.success) {
        setProducts(prodRes.products);
        if (!selectedProductId && prodRes.products.length > 0) {
          setSelectedProductId(prodRes.products[0]._id);
        }
      }
      if (whRes.success) setWarehouses(whRes.warehouses);
    } catch (err: any) {
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterType, filterProduct, filterWarehouse]);

  const handleOpenAction = (type: 'stock-in' | 'stock-out' | 'adjust', prodId?: string) => {
    setActionError(null);
    setSuccessMessage(null);
    if (prodId) {
      setSelectedProductId(prodId);
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0]._id);
    }
    setQuantity(type === 'adjust' ? 25 : 10);
    setReason(
      type === 'stock-in'
        ? 'Restock intake from supplier'
        : type === 'stock-out'
        ? 'Internal project transfer / sample order'
        : 'Physical cycle count discrepancy adjustment'
    );
    setActiveModal(type);
  };

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (activeModal === 'stock-in') {
        const res = await api.inventory.stockIn({
          productId: selectedProductId,
          quantity: Number(quantity),
          reason,
        });
        setSuccessMessage(res.message);
      } else if (activeModal === 'stock-out') {
        const res = await api.inventory.stockOut({
          productId: selectedProductId,
          quantity: Number(quantity),
          reason,
        });
        setSuccessMessage(res.message);
      } else if (activeModal === 'adjust') {
        const res = await api.inventory.adjust({
          productId: selectedProductId,
          newQuantity: Number(quantity),
          reason,
        });
        setSuccessMessage(res.message);
      }

      setActiveModal(null);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Action failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProduct = products.find(p => p._id === selectedProductId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Inventory & Stock Movements</h2>
          <p className="text-xs text-slate-500">
            Real-time balance, stock adjustments, movement audits, and warehouse-wise allocation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenAction('stock-in')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Stock In</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAction('stock-out')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all flex items-center gap-1.5 shadow-md shadow-rose-500/20"
          >
            <Minus className="w-3.5 h-3.5" />
            <span>Stock Out</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAction('adjust')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Adjust Balance</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Warehouse Overview Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overview?.warehouseBreakdown?.map((wh: any) => (
          <div key={wh.warehouseId} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {wh.warehouseCode}
              </span>
              <Warehouse className="w-4 h-4 text-slate-400" />
            </div>

            <h4 className="font-bold text-slate-900 text-sm">{wh.warehouseName}</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">{wh.location}</p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Total Units</span>
                <span className="font-extrabold text-slate-900">{wh.totalUnits}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">Valuation</span>
                <span className="font-extrabold text-blue-600">${wh.totalValuation.toLocaleString()}</span>
              </div>
            </div>

            {wh.lowStockCount > 0 && (
              <div className="mt-2 text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{wh.lowStockCount} items low or out of stock</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Movement History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Inventory Movement Audit Log</h3>
            <span className="text-xs text-slate-400">({movements.length} events)</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="All">All Movements</option>
              <option value="Stock In">Stock In</option>
              <option value="Stock Out">Stock Out</option>
              <option value="Adjustment">Adjustment</option>
            </select>

            {/* Filter by Product */}
            <select
              value={filterProduct}
              onChange={e => setFilterProduct(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden max-w-[200px]"
            >
              <option value="All">All Products</option>
              {products.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Filter by Warehouse */}
            <select
              value={filterWarehouse}
              onChange={e => setFilterWarehouse(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="All">All Hubs</option>
              {warehouses.map(w => (
                <option key={w._id} value={w._id}>
                  {w.warehouseCode}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={loadData}
              className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-500"
              title="Refresh Logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Warehouse</th>
                <th className="py-3 px-4 text-center">Movement Type</th>
                <th className="py-3 px-4 text-center">Quantity</th>
                <th className="py-3 px-4">Reason / Reference</th>
                <th className="py-3 px-4">Authorized By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading movement records...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No movements found for the selected filter.
                  </td>
                </tr>
              ) : (
                movements.map(m => (
                  <tr key={m._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleDateString()}{' '}
                      <span className="text-[10px] text-slate-400">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{m.productName}</p>
                      <span className="font-mono text-[10px] text-slate-400">{m.productSku}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {m.warehouseName}{' '}
                      <span className="text-[10px] text-slate-400 font-mono">({m.warehouseCode})</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          m.movementType === 'Stock In'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : m.movementType === 'Stock Out'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {m.movementType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-extrabold text-sm">
                      <span
                        className={
                          m.movementType === 'Stock In'
                            ? 'text-emerald-600'
                            : m.movementType === 'Stock Out'
                            ? 'text-rose-600'
                            : 'text-indigo-600'
                        }
                      >
                        {m.movementType === 'Stock In' && '+'}
                        {m.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={m.reason}>
                      {m.reason}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      {m.performedBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Action Modal (Stock In / Stock Out / Adjust) */}
      <Modal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={
          activeModal === 'stock-in'
            ? 'Record Stock Intake (Stock In)'
            : activeModal === 'stock-out'
            ? 'Record Stock Removal (Stock Out)'
            : 'Perform Stock Balance Adjustment'
        }
        subtitle="Every inventory change creates an immutable audit trail entry."
        maxWidth="md"
      >
        {actionError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {actionError}
          </div>
        )}

        <form onSubmit={handleSubmitAction} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Target Product *</label>
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:outline-hidden"
            >
              {products.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku}) — Available: {p.currentStock} units
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Warehouse Facility</span>
                <span className="font-semibold text-slate-800">{selectedProduct.warehouseName}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Current Available Stock</span>
                <span className="font-bold text-slate-900 text-sm">{selectedProduct.currentStock} units</span>
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {activeModal === 'adjust' ? 'New Target Stock Quantity *' : 'Quantity to Move *'}
            </label>
            <input
              type="number"
              min={activeModal === 'adjust' ? '0' : '1'}
              required
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
            />
            {activeModal === 'stock-out' && selectedProduct && quantity > selectedProduct.currentStock && (
              <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Error: Quantity exceeds available stock ({selectedProduct.currentStock} units).
              </p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Audit Reason / Description *</label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Physical cycle count discrepancy, supplier freight intake, damaged goods..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (activeModal === 'stock-out' && selectedProduct && quantity > selectedProduct.currentStock)}
              className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Confirm Movement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
