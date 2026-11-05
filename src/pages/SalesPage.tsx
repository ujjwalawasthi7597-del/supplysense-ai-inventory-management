import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Plus,
  Search,
  Calendar,
  DollarSign,
  User,
  ShoppingBag,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Eye,
  ChevronRight,
  Boxes,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { Sale, Product } from '../types/index.ts';
import { Modal } from '../components/common/Modal.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export const SalesPage: React.FC = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals & Actions
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [saleForm, setSaleForm] = useState({
    customerName: '',
    notes: '',
    saleDate: new Date().toISOString().split('T')[0],
    products: [
      { productId: '', quantity: 1, unitPrice: 0 },
    ],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesRes, prodRes] = await Promise.all([
        api.sales.getAll({ search, startDate, endDate }),
        api.products.getAll(),
      ]);

      if (salesRes.success) {
        setSales(salesRes.sales);
        setTotalRevenue(salesRes.totalRevenue || 0);
      }
      if (prodRes.success) {
        setProducts(prodRes.products);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const handleOpenRecord = () => {
    setActionError(null);
    setActionSuccess(null);
    const inStockProds = products.filter(p => p.currentStock > 0);
    const defaultProd = inStockProds[0] || products[0];

    setSaleForm({
      customerName: '',
      notes: '',
      saleDate: new Date().toISOString().split('T')[0],
      products: [
        {
          productId: defaultProd?._id || '',
          quantity: 1,
          unitPrice: defaultProd?.sellingPrice || 0,
        },
      ],
    });
    setIsRecordModalOpen(true);
  };

  const handleAddLineItem = () => {
    const defaultProd = products.find(p => p.currentStock > 0) || products[0];
    setSaleForm(prev => ({
      ...prev,
      products: [
        ...prev.products,
        {
          productId: defaultProd?._id || '',
          quantity: 1,
          unitPrice: defaultProd?.sellingPrice || 0,
        },
      ],
    }));
  };

  const handleRemoveLineItem = (index: number) => {
    if (saleForm.products.length <= 1) return;
    setSaleForm(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  };

  const handleLineItemChange = (index: number, field: string, val: any) => {
    setSaleForm(prev => {
      const updated = [...prev.products];
      if (field === 'productId') {
        const prod = products.find(p => p._id === val);
        updated[index] = {
          ...updated[index],
          productId: val,
          unitPrice: prod ? prod.sellingPrice : updated[index].unitPrice,
        };
      } else {
        updated[index] = { ...updated[index], [field]: val };
      }
      return { ...prev, products: updated };
    });
  };

  // Check if any product line item exceeds current inventory
  const hasInsufficientStock = () => {
    return saleForm.products.some(item => {
      const prod = products.find(p => p._id === item.productId);
      if (!prod) return true;
      return Number(item.quantity) > prod.currentStock;
    });
  };

  const calculateTotal = () => {
    return saleForm.products.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
  };

  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (hasInsufficientStock()) {
      setActionError('Cannot proceed: One or more selected items exceed available warehouse stock.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.sales.create(saleForm);
      if (res.success) {
        setActionSuccess(res.message);
        setIsRecordModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      setActionError(err.message || 'Error recording sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Sales & Customer Orders</h2>
          <p className="text-xs text-slate-500">
            Record customer orders with real-time stock checks, automated inventory decrements, and revenue metrics.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenRecord}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Sale</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button type="button" onClick={() => setActionSuccess(null)} className="text-emerald-700 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Revenue (Recorded)</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
            ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Fulfilled Sales Orders</span>
          <span className="text-2xl font-extrabold text-blue-600 mt-1 block">{sales.length} Orders</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Average Order Value</span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
            ${sales.length > 0 ? (totalRevenue / sales.length).toFixed(2) : '0.00'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[240px] max-w-sm flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sale number or customer..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
            <span className="text-slate-400 text-[10px]">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-transparent focus:outline-hidden text-slate-700"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
            <span className="text-slate-400 text-[10px]">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-transparent focus:outline-hidden text-slate-700"
            />
          </div>

          <button
            type="button"
            onClick={loadData}
            className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-500"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Sale Order #</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Items Dispatched</th>
                <th className="py-3 px-4 text-right">Total Price</th>
                <th className="py-3 px-4">Sales Agent</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading sales records...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No sales records found. Click 'Record New Sale' to create one.
                  </td>
                </tr>
              ) : (
                sales.map(s => (
                  <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.saleNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {s.customerName || 'Direct Counter Client'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(s.saleDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {s.products.reduce((acc, p) => acc + p.quantity, 0)} units
                      <span className="block text-[10px] text-slate-400 font-normal">({s.products.length} SKUs)</span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 text-sm">
                      ${s.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{s.createdBy}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setViewingSale(s)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-blue-600"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Sale Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record New Customer Sale"
        subtitle="Automatic stock verification prevents negative inventory. Confirmed sales deduct stock immediately."
        maxWidth="xl"
      >
        {actionError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {actionError}
          </div>
        )}

        <form onSubmit={handleSubmitSale} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer / Organization Name</label>
              <input
                type="text"
                value={saleForm.customerName}
                onChange={e => setSaleForm({ ...saleForm, customerName: e.target.value })}
                placeholder="e.g. Metro Transit Authorities or Walk-in"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sale Date</label>
              <input
                type="date"
                required
                value={saleForm.saleDate}
                onChange={e => setSaleForm({ ...saleForm, saleDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Product Items Picker */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-900">Products Dispatched</span>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>

            <div className="space-y-3">
              {saleForm.products.map((item, idx) => {
                const prod = products.find(p => p._id === item.productId);
                const isOver = prod && Number(item.quantity) > prod.currentStock;

                return (
                  <div key={idx} className={`p-3 rounded-xl border ${isOver ? 'bg-rose-50/50 border-rose-300' : 'bg-white border-slate-200'}`}>
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Select Product</label>
                        <select
                          value={item.productId}
                          onChange={e => handleLineItemChange(idx, 'productId', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-hidden text-xs"
                        >
                          {products.map(p => (
                            <option key={p._id} value={p._id}>
                              {p.name} ({p.currentStock} in stock)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={e => handleLineItemChange(idx, 'quantity', Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Selling Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={item.unitPrice}
                          onChange={e => handleLineItemChange(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
                        />
                      </div>

                      <div className="col-span-2 flex items-center justify-between pt-3">
                        <span className="font-extrabold text-slate-900 text-xs">
                          ${(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)}
                        </span>
                        {saleForm.products.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stock Alert */}
                    {prod && (
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          Warehouse: <span className="font-medium text-slate-700">{prod.warehouseName}</span> (Stock: {prod.currentStock})
                        </span>
                        {isOver && (
                          <span className="font-bold text-rose-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Insufficient inventory! Max available: {prod.currentStock}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between font-bold text-sm">
              <span>Gross Sales Total</span>
              <span className="text-emerald-600 text-base font-extrabold">
                ${calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes / Shipping Details</label>
            <textarea
              rows={2}
              value={saleForm.notes}
              onChange={e => setSaleForm({ ...saleForm, notes: e.target.value })}
              placeholder="Client purchase order reference, dispatch tracking number..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || hasInsufficientStock()}
              className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Recording Sale...' : 'Confirm Sale & Deduct Stock'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Sale Details Modal */}
      <Modal
        isOpen={viewingSale !== null}
        onClose={() => setViewingSale(null)}
        title={viewingSale ? `Sales Order ${viewingSale.saleNumber}` : 'Sale Details'}
        subtitle={`Dispatched on ${viewingSale ? new Date(viewingSale.saleDate).toLocaleDateString() : ''}`}
        maxWidth="md"
      >
        {viewingSale && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px]">Client / Buyer</span>
                <span className="font-bold text-slate-900 text-sm">{viewingSale.customerName || 'Direct Counter'}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">Order Value</span>
                <span className="font-extrabold text-emerald-600 text-base">${viewingSale.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 mb-2">Items Included</h5>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {viewingSale.products.map((item, i) => (
                  <div key={i} className="p-3 flex items-center justify-between bg-white">
                    <div>
                      <p className="font-bold text-slate-900">{item.productName}</p>
                      <span className="text-[10px] text-slate-400">{item.quantity} units @ ${item.unitPrice.toFixed(2)}</span>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {viewingSale.notes && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Notes</span>
                <p className="text-slate-600 mt-0.5">{viewingSale.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
