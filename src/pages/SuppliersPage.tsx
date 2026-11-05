import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Mail,
  Phone,
  MapPin,
  FileSpreadsheet,
  Package,
  Edit2,
  Trash2,
  RefreshCw,
  Building2,
  Calendar,
  CreditCard,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { Supplier, Product, PurchaseOrder } from '../types/index.ts';
import { Modal } from '../components/common/Modal.tsx';
import { POBadge } from '../components/common/Badge.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export const SuppliersPage: React.FC = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<any | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    paymentTerms: 'Net 30',
  });

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.suppliers.getAll();
      if (res.success) setSuppliers(res.suppliers);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleOpenAdd = () => {
    setActionError(null);
    setFormData({
      name: '',
      companyName: '',
      email: '',
      phone: '',
      address: '',
      paymentTerms: 'Net 30',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setActionError(null);
    setEditingSupplier(s);
    setFormData({
      name: s.name,
      companyName: s.companyName,
      email: s.email,
      phone: s.phone || '',
      address: s.address || '',
      paymentTerms: s.paymentTerms || 'Net 30',
    });
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsSubmitting(true);
    try {
      if (editingSupplier) {
        await api.suppliers.update(editingSupplier._id, formData);
        setEditingSupplier(null);
      } else {
        await api.suppliers.create(formData);
        setIsAddModalOpen(false);
      }
      loadSuppliers();
    } catch (err: any) {
      setActionError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSupplier) return;
    setActionError(null);
    setIsSubmitting(true);
    try {
      await api.suppliers.delete(deletingSupplier._id);
      setDeletingSupplier(null);
      loadSuppliers();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const res = await api.suppliers.getById(id);
      if (res.success) {
        setViewingSupplier(res.supplier);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Supplier Directory & Vendors</h2>
          <p className="text-xs text-slate-500">
            Vendor accounts, payment terms, procurement contracts, and historical fulfillment performance.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Supplier Grid */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mb-2" />
          <p className="text-xs font-semibold">Loading suppliers...</p>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">No Suppliers Configured</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Register your first manufacturing partner or parts distributor.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {suppliers.map(s => (
            <div
              key={s._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-sm">
                    {s.companyName.charAt(0)}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(s)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                      title="Edit Supplier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {user?.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setActionError(null);
                          setDeletingSupplier(s);
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                        title="Delete Supplier (PO check enforced)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-3">{s.companyName}</h3>
                <p className="text-xs text-slate-500 font-medium">{s.name} (Primary Contact)</p>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{s.email}</span>
                  </div>
                  {s.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                  {s.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate text-[11px] text-slate-500">{s.address}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Terms</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-slate-400" />
                      {s.paymentTerms}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Delivered Spend</span>
                    <span className="font-bold text-emerald-600">
                      ${(s.totalDeliveredSpend || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {s.productsCount || 0} catalog SKUs
                </span>

                <button
                  type="button"
                  onClick={() => handleViewDetails(s._id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1"
                >
                  <span>Orders & SKUs</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isAddModalOpen || editingSupplier !== null}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingSupplier(null);
        }}
        title={editingSupplier ? 'Edit Supplier Profile' : 'Register New Supplier'}
        subtitle="Maintain vendor contact info, shipping address, and contractual payment terms."
        maxWidth="md"
      >
        {actionError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {actionError}
          </div>
        )}

        <form onSubmit={handleSaveSupplier} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company / Organization Name *</label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={e => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="e.g. Nexus Electronics Corp"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Representative *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="David Miller"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="procurement@company.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Direct Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
              <select
                value={formData.paymentTerms}
                onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:outline-hidden"
              >
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
                <option value="2/10 Net 30">2/10 Net 30 (2% 10-day discount)</option>
                <option value="Prepaid">Prepaid / Advance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Business Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full mailing or warehouse facility address"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingSupplier(null);
              }}
              className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Register Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Supplier Details & PO History Modal */}
      <Modal
        isOpen={viewingSupplier !== null}
        onClose={() => setViewingSupplier(null)}
        title={viewingSupplier?.companyName || 'Supplier Details'}
        subtitle={`Representative: ${viewingSupplier?.name} • Terms: ${viewingSupplier?.paymentTerms}`}
        maxWidth="lg"
      >
        {viewingSupplier && (
          <div className="space-y-4 text-xs">
            {/* Products Provided */}
            <div>
              <h5 className="font-bold text-slate-900 mb-2">Catalog SKUs Supplied</h5>
              {viewingSupplier.products?.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  {viewingSupplier.products.map((p: Product) => (
                    <div key={p._id} className="p-2.5 flex items-center justify-between bg-white text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <span className="font-mono text-[10px] text-slate-400">{p.sku}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-800">${p.purchasePrice.toFixed(2)} cost</span>
                        <span className="text-[10px] text-slate-400 block">{p.currentStock} units in stock</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No products currently assigned to this vendor.</p>
              )}
            </div>

            {/* Purchase Order History */}
            <div>
              <h5 className="font-bold text-slate-900 mb-2">Purchase Order History</h5>
              {viewingSupplier.purchaseOrders?.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  {viewingSupplier.purchaseOrders.map((po: PurchaseOrder) => (
                    <div key={po._id} className="p-2.5 flex items-center justify-between bg-white text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-slate-900">{po.poNumber}</span>
                          <POBadge status={po.status} />
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Order Date: {new Date(po.orderDate).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="font-extrabold text-slate-900 text-sm">
                        ${po.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No purchase orders on record for this vendor.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Supplier Modal */}
      <Modal
        isOpen={deletingSupplier !== null}
        onClose={() => setDeletingSupplier(null)}
        title="Confirm Vendor Deletion"
        subtitle="PO dependency check enforced."
        maxWidth="sm"
      >
        {actionError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {actionError}
          </div>
        )}

        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Are you sure you want to delete <span className="font-bold text-slate-900">{deletingSupplier?.companyName}</span>?
          Vendors with active purchase orders cannot be deleted.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setDeletingSupplier(null)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Deleting...' : 'Delete Vendor'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
