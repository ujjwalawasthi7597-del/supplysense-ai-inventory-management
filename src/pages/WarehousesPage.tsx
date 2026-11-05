import React, { useState, useEffect } from 'react';
import {
  Warehouse as WarehouseIcon,
  Plus,
  MapPin,
  User,
  Phone,
  Package,
  DollarSign,
  Edit2,
  Trash2,
  RefreshCw,
  Boxes,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { Warehouse as WarehouseType, Product } from '../types/index.ts';
import { Modal } from '../components/common/Modal.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export const WarehousesPage: React.FC = () => {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseType | null>(null);
  const [viewingWarehouse, setViewingWarehouse] = useState<any | null>(null);
  const [deletingWarehouse, setDeletingWarehouse] = useState<WarehouseType | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    warehouseCode: '',
    location: '',
    managerName: '',
    contactNumber: '',
    description: '',
  });

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const res = await api.warehouses.getAll();
      if (res.success) setWarehouses(res.warehouses);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  const handleOpenAdd = () => {
    setActionError(null);
    setFormData({
      name: '',
      warehouseCode: `WH-${Date.now().toString().slice(-4)}`,
      location: '',
      managerName: '',
      contactNumber: '',
      description: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (w: WarehouseType) => {
    setActionError(null);
    setEditingWarehouse(w);
    setFormData({
      name: w.name,
      warehouseCode: w.warehouseCode,
      location: w.location,
      managerName: w.managerName || '',
      contactNumber: w.contactNumber || '',
      description: w.description || '',
    });
  };

  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsSubmitting(true);
    try {
      if (editingWarehouse) {
        await api.warehouses.update(editingWarehouse._id, formData);
        setEditingWarehouse(null);
      } else {
        await api.warehouses.create(formData);
        setIsAddModalOpen(false);
      }
      loadWarehouses();
    } catch (err: any) {
      setActionError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingWarehouse) return;
    setActionError(null);
    setIsSubmitting(true);
    try {
      await api.warehouses.delete(deletingWarehouse._id);
      setDeletingWarehouse(null);
      loadWarehouses();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete warehouse');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const res = await api.warehouses.getById(id);
      if (res.success) {
        setViewingWarehouse(res.warehouse);
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
          <h2 className="text-lg font-bold text-slate-900">Warehouse Network</h2>
          <p className="text-xs text-slate-500">
            Regional distribution centers, fulfillment capacity, inventory valuation, and facility management.
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Warehouse</span>
          </button>
        )}
      </div>

      {/* Warehouse Cards Grid */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mb-2" />
          <p className="text-xs font-semibold">Loading warehouse facilities...</p>
        </div>
      ) : warehouses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <WarehouseIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">No Warehouses Configured</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Create your first regional storage warehouse or distribution depot.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {warehouses.map(w => (
            <div
              key={w._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      {w.warehouseCode}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {w.location}
                    </span>
                  </div>

                  {user?.role === 'admin' && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(w)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                        title="Edit Facility"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActionError(null);
                          setDeletingWarehouse(w);
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                        title="Delete Facility (Stock check enforced)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-2.5">{w.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {w.description || 'Primary regional distribution facility.'}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Facility Manager</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3 text-slate-400" />
                      {w.managerName || 'Operations Team'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Direct Contact</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {w.contactNumber || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block">Stored Stock Value</span>
                  <span className="font-extrabold text-blue-600 text-sm">
                    ${(w.totalValuation || 0).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-500 ml-1.5 font-medium">
                    ({w.productCount || 0} SKUs, {w.totalUnits || 0} units)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleViewDetails(w._id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1"
                >
                  <span>Stored SKUs</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Warehouse Modal */}
      <Modal
        isOpen={isAddModalOpen || editingWarehouse !== null}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingWarehouse(null);
        }}
        title={editingWarehouse ? 'Edit Warehouse Facility' : 'Register New Warehouse'}
        subtitle="Manage facility code, regional location, and facility manager contact."
        maxWidth="md"
      >
        {actionError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {actionError}
          </div>
        )}

        <form onSubmit={handleSaveWarehouse} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Facility Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Mid-Atlantic Cross-Dock Terminal"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Warehouse Code *</label>
              <input
                type="text"
                required
                value={formData.warehouseCode}
                onChange={e => setFormData({ ...formData, warehouseCode: e.target.value.toUpperCase() })}
                placeholder="WH-PHL-05"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:border-blue-600 focus:outline-hidden uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Location / City *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="Philadelphia, PA"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Manager Name</label>
              <input
                type="text"
                value={formData.managerName}
                onChange={e => setFormData({ ...formData, managerName: e.target.value })}
                placeholder="Marcus Vance"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.contactNumber}
                onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Facility Description & Notes</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Dock bay count, climate specifications, operating hours..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingWarehouse(null);
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
              {isSubmitting ? 'Saving...' : editingWarehouse ? 'Update Facility' : 'Create Facility'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Warehouse Stored Products Modal */}
      <Modal
        isOpen={viewingWarehouse !== null}
        onClose={() => setViewingWarehouse(null)}
        title={viewingWarehouse?.name || 'Warehouse Products'}
        subtitle={`Code: ${viewingWarehouse?.warehouseCode} • Location: ${viewingWarehouse?.location}`}
        maxWidth="lg"
      >
        {viewingWarehouse && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 block">Unique Products</span>
                <span className="font-extrabold text-slate-900 text-base">{viewingWarehouse.productCount} SKUs</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 block">Total Units</span>
                <span className="font-extrabold text-slate-900 text-base">{viewingWarehouse.totalUnits} units</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 block">Facility Valuation</span>
                <span className="font-extrabold text-blue-600 text-base">${viewingWarehouse.totalValuation.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 mb-2">Stored Product Inventory</h5>
              {viewingWarehouse.products?.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  {viewingWarehouse.products.map((p: Product) => (
                    <div key={p._id} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <span className="font-mono text-[10px] text-slate-400">{p.sku} • {p.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-slate-900 block text-xs">{p.currentStock} units</span>
                        <span className="text-[10px] text-slate-400">Value: ${(p.currentStock * p.purchasePrice).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-slate-400 italic">No products currently stored in this warehouse.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Warehouse Modal (With Stock Dependency Check) */}
      <Modal
        isOpen={deletingWarehouse !== null}
        onClose={() => setDeletingWarehouse(null)}
        title="Confirm Warehouse Deletion"
        subtitle="Stock dependency check will be enforced."
        maxWidth="sm"
      >
        {actionError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {actionError}
          </div>
        )}

        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Are you sure you want to delete <span className="font-bold text-slate-900">{deletingWarehouse?.name}</span> ({deletingWarehouse?.warehouseCode})?
          As mandated by system rules, warehouses with active inventory stock cannot be deleted.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setDeletingWarehouse(null)}
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
            {isSubmitting ? 'Deleting...' : 'Delete Facility'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
