import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Calendar,
  Clock,
  Warehouse,
  Truck,
  Trash2,
  Eye,
  AlertTriangle,
  RefreshCw,
  Building2,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { PurchaseOrder, Supplier, Warehouse as WarehouseType, Product } from '../types/index.ts';
import { POBadge } from '../components/common/Badge.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface PurchaseOrdersPageProps {
  initialPreFill?: {
    supplierId: string;
    warehouseId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
  } | null;
}

export const PurchaseOrdersPage: React.FC<PurchaseOrdersPageProps> = ({ initialPreFill }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals & Actions
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingPO, setViewingPO] = useState<any | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for dynamic line items
  const [poForm, setPoForm] = useState({
    supplierId: '',
    warehouseId: '',
    expectedDeliveryDate: '',
    notes: '',
    products: [
      { productId: '', quantity: 20, unitPrice: 50 },
    ],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [poRes, supRes, whRes, prodRes] = await Promise.all([
        api.purchaseOrders.getAll({ status: statusFilter }),
        api.suppliers.getAll(),
        api.warehouses.getAll(),
        api.products.getAll(),
      ]);

      if (poRes.success) setOrders(poRes.purchaseOrders);
      if (supRes.success) setSuppliers(supRes.suppliers);
      if (whRes.success) setWarehouses(whRes.warehouses);
      if (prodRes.success) setProducts(prodRes.products);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Pre-fill from AI reorder suggestion if passed
  useEffect(() => {
    if (initialPreFill && products.length > 0 && suppliers.length > 0) {
      const targetProd = products.find(p => p._id === initialPreFill.productId);
      setPoForm({
        supplierId: initialPreFill.supplierId || suppliers[0]._id,
        warehouseId: initialPreFill.warehouseId || warehouses[0]?._id || '',
        expectedDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: `Automated reorder created via AI Demand & Reorder Recommendation. Target replenishment: ${targetProd?.name || 'SKU'}.`,
        products: [
          {
            productId: initialPreFill.productId,
            quantity: initialPreFill.quantity,
            unitPrice: initialPreFill.unitPrice,
          },
        ],
      });
      setIsCreateModalOpen(true);
    }
  }, [initialPreFill, products, suppliers]);

  const handleOpenCreate = () => {
    setActionError(null);
    setActionSuccess(null);
    const tenDaysAhead = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setPoForm({
      supplierId: suppliers[0]?._id || '',
      warehouseId: warehouses[0]?._id || '',
      expectedDeliveryDate: tenDaysAhead,
      notes: '',
      products: [
        {
          productId: products[0]?._id || '',
          quantity: 25,
          unitPrice: products[0]?.purchasePrice || 50,
        },
      ],
    });
    setIsCreateModalOpen(true);
  };

  const handleAddLineItem = () => {
    const firstProd = products[0];
    setPoForm(prev => ({
      ...prev,
      products: [
        ...prev.products,
        {
          productId: firstProd?._id || '',
          quantity: 10,
          unitPrice: firstProd?.purchasePrice || 20,
        },
      ],
    }));
  };

  const handleRemoveLineItem = (index: number) => {
    if (poForm.products.length <= 1) return;
    setPoForm(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  };

  const handleLineItemChange = (index: number, field: string, val: any) => {
    setPoForm(prev => {
      const updated = [...prev.products];
      if (field === 'productId') {
        const prod = products.find(p => p._id === val);
        updated[index] = {
          ...updated[index],
          productId: val,
          unitPrice: prod ? prod.purchasePrice : updated[index].unitPrice,
        };
      } else {
        updated[index] = { ...updated[index], [field]: val };
      }
      return { ...prev, products: updated };
    });
  };

  const calculateFormTotal = () => {
    return poForm.products.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await api.purchaseOrders.create({
        ...poForm,
        status: user?.role === 'admin' ? 'Approved' : 'Pending Approval',
      });

      if (res.success) {
        setActionSuccess(`Purchase Order ${res.purchaseOrder.poNumber} created successfully! Total: $${res.purchaseOrder.totalAmount.toLocaleString()}`);
        setIsCreateModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to create purchase order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionError(null);
      setActionSuccess(null);
      const res = await api.purchaseOrders.approve(id);
      if (res.success) {
        setActionSuccess(res.message);
        loadData();
        if (viewingPO) setViewingPO(res.purchaseOrder);
      }
    } catch (err: any) {
      setActionError(err.message || 'Approval failed');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Please specify rejection reason for audit records:', 'Exceeded quarterly budget cap');
    if (reason === null) return;

    try {
      setActionError(null);
      setActionSuccess(null);
      const res = await api.purchaseOrders.reject(id, reason);
      if (res.success) {
        setActionSuccess(res.message);
        loadData();
        if (viewingPO) setViewingPO(res.purchaseOrder);
      }
    } catch (err: any) {
      setActionError(err.message || 'Rejection failed');
    }
  };

  const handleReceive = async (id: string) => {
    try {
      setActionError(null);
      setActionSuccess(null);
      const res = await api.purchaseOrders.receive(id);
      if (res.success) {
        setActionSuccess(res.message);
        loadData();
        if (viewingPO) setViewingPO(res.purchaseOrder);
      }
    } catch (err: any) {
      setActionError(err.message || 'Receiving failed');
    }
  };

  const handleViewPO = async (id: string) => {
    try {
      const res = await api.purchaseOrders.getById(id);
      if (res.success) {
        setViewingPO(res.purchaseOrder);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders = orders.filter(po => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      po.poNumber.toLowerCase().includes(q) ||
      (po.supplierName && po.supplierName.toLowerCase().includes(q))
    );
  });

  const statuses = ['All', 'Draft', 'Pending Approval', 'Approved', 'Ordered', 'Received', 'Rejected'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Purchase Orders & Procurement</h2>
          <p className="text-xs text-slate-500">
            Submit requisition requests, admin approvals, order vendor shipments, and execute automated stock receiving.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{user?.role === 'admin' ? 'Issue Purchase Order' : 'Request Purchase Order'}</span>
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

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button type="button" onClick={() => setActionError(null)} className="text-rose-700 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {statuses.map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search PO number or vendor..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Vendor & Facility</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Order Total</th>
                <th className="py-3 px-4">Expected Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading purchase orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No purchase orders found matching '{statusFilter}'.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(po => (
                  <tr key={po._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{po.poNumber}</span>
                      <span className="text-[10px] text-slate-400">Created by {po.createdBy}</span>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{po.supplierName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Destination: {po.warehouseName}</p>
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {po.products.reduce((acc, item) => acc + item.quantity, 0)} units
                      <span className="block text-[10px] text-slate-400 font-normal">({po.products.length} SKUs)</span>
                    </td>

                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 text-sm">
                      ${po.totalAmount.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(po.expectedDeliveryDate).toLocaleDateString()}
                      </span>
                      {po.actualDeliveryDate && (
                        <span className="block text-[10px] text-emerald-600 font-medium">
                          Received: {new Date(po.actualDeliveryDate).toLocaleDateString()}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <POBadge status={po.status} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleViewPO(po._id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-blue-600"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Admin Approvals */}
                        {user?.role === 'admin' && po.status === 'Pending Approval' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(po._id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              title="Approve Order"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(po._id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                              title="Reject Order"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* Receiving Goods into Inventory */}
                        {(po.status === 'Approved' || po.status === 'Ordered') && (
                          <button
                            type="button"
                            onClick={() => handleReceive(po._id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 flex items-center gap-1"
                            title="Mark Received (Updates Stock & Prevents Duplicates)"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Receive Goods</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Purchase Order Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={user?.role === 'admin' ? 'Issue Purchase Order' : 'Create Purchase Order Request'}
        subtitle="Add line items, quantities, and vendor pricing. Totals are calculated in real-time."
        maxWidth="2xl"
      >
        {actionError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {actionError}
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Supplier *</label>
              <select
                required
                value={poForm.supplierId}
                onChange={e => setPoForm({ ...poForm, supplierId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
              >
                {suppliers.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Receiving Warehouse *</label>
              <select
                required
                value={poForm.warehouseId}
                onChange={e => setPoForm({ ...poForm, warehouseId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
              >
                {warehouses.map(w => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({w.warehouseCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expected Delivery Date *</label>
              <input
                type="date"
                required
                value={poForm.expectedDeliveryDate}
                onChange={e => setPoForm({ ...poForm, expectedDeliveryDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Product Line Items */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-900">Order Line Items</span>
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
              {poForm.products.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-slate-200">
                  <div className="col-span-6">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Product SKU</label>
                    <select
                      value={item.productId}
                      onChange={e => handleLineItemChange(idx, 'productId', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-hidden text-xs"
                    >
                      {products.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.sku})
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
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Unit Price ($)</label>
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
                    {poForm.products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md"
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between font-bold text-sm">
              <span>Estimated Order Total</span>
              <span className="text-blue-600 text-base font-extrabold">
                ${calculateFormTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Procurement Notes / Instructions</label>
            <textarea
              rows={2}
              value={poForm.notes}
              onChange={e => setPoForm({ ...poForm, notes: e.target.value })}
              placeholder="Shipping terms, freight dock access, customs reference..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Order...' : user?.role === 'admin' ? 'Issue Order' : 'Submit Requisition'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View PO Details Modal */}
      <Modal
        isOpen={viewingPO !== null}
        onClose={() => setViewingPO(null)}
        title={viewingPO ? `Purchase Order ${viewingPO.poNumber}` : 'PO Details'}
        subtitle={`Status: ${viewingPO?.status} • Created by ${viewingPO?.createdBy}`}
        maxWidth="lg"
      >
        {viewingPO && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px]">Supplier / Vendor</span>
                <span className="font-bold text-slate-900">{viewingPO.supplier?.companyName || viewingPO.supplierName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Receiving Facility</span>
                <span className="font-bold text-slate-900">{viewingPO.warehouse?.name || viewingPO.warehouseName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Order Amount</span>
                <span className="font-extrabold text-blue-600 text-sm">${viewingPO.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 mb-2">Line Items Ordered</h5>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {viewingPO.products.map((item: any, i: number) => (
                  <div key={i} className="p-3 flex items-center justify-between bg-white">
                    <div>
                      <p className="font-bold text-slate-900">{item.productName}</p>
                      <span className="text-[10px] text-slate-400">{item.quantity} units @ ${item.unitPrice.toFixed(2)}</span>
                    </div>
                    <span className="font-extrabold text-slate-900 text-sm">${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {viewingPO.notes && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold">Notes & Audit Trail</span>
                <p className="text-slate-600 mt-1 whitespace-pre-line leading-relaxed">{viewingPO.notes}</p>
              </div>
            )}

            {/* Quick Actions in Details Drawer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              {user?.role === 'admin' && viewingPO.status === 'Pending Approval' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleApprove(viewingPO._id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    Approve Order
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(viewingPO._id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                  >
                    Reject
                  </button>
                </>
              )}

              {(viewingPO.status === 'Approved' || viewingPO.status === 'Ordered') && (
                <button
                  type="button"
                  onClick={() => handleReceive(viewingPO._id)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Receive Goods Into Inventory</span>
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
