import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  LayoutGrid,
  List,
  RefreshCw,
  Warehouse,
  Truck,
  ArrowUpDown,
  Boxes,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { Product, Warehouse as WarehouseType, Supplier } from '../types/index.ts';
import { StockBadge } from '../components/common/Badge.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [warehouseId, setWarehouseId] = useState('All');
  const [stockStatus, setStockStatus] = useState('All');
  const [sortBy, setSortBy] = useState('name_asc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<any | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    description: '',
    image: '',
    purchasePrice: 50,
    sellingPrice: 95,
    currentStock: 25,
    minimumStock: 10,
    warehouseId: '',
    supplierId: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, whRes, supRes] = await Promise.all([
        api.products.getAll({ search, category, warehouseId, stockStatus, sortBy }),
        api.warehouses.getAll(),
        api.suppliers.getAll(),
      ]);

      if (prodRes.success) setProducts(prodRes.products);
      if (whRes.success) {
        setWarehouses(whRes.warehouses);
        if (!formData.warehouseId && whRes.warehouses.length > 0) {
          setFormData(prev => ({ ...prev, warehouseId: whRes.warehouses[0]._id }));
        }
      }
      if (supRes.success) {
        setSuppliers(supRes.suppliers);
        if (!formData.supplierId && supRes.suppliers.length > 0) {
          setFormData(prev => ({ ...prev, supplierId: supRes.suppliers[0]._id }));
        }
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [category, warehouseId, stockStatus, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenAdd = () => {
    setActionError(null);
    setFormData({
      name: '',
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      category: 'Electronics',
      description: '',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=80',
      purchasePrice: 45,
      sellingPrice: 89,
      currentStock: 20,
      minimumStock: 10,
      warehouseId: warehouses[0]?._id || '',
      supplierId: suppliers[0]?._id || '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setActionError(null);
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      description: product.description || '',
      image: product.image || '',
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      currentStock: product.currentStock,
      minimumStock: product.minimumStock,
      warehouseId: product.warehouseId,
      supplierId: product.supplierId,
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await api.products.update(editingProduct._id, formData);
        setEditingProduct(null);
      } else {
        await api.products.create(formData);
        setIsAddModalOpen(false);
      }
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    setActionError(null);
    setIsSubmitting(true);
    try {
      await api.products.delete(deletingProduct._id);
      setDeletingProduct(null);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const res = await api.products.getById(id);
      if (res.success) {
        setViewingProduct(res.product);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const categories = ['All', 'Electronics', 'Hardware', 'Logistics Supplies', 'Sensors', 'Power Systems'];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Product Catalog & SKUs</h2>
          <p className="text-xs text-slate-500">
            Maintain master SKU registry, minimum safety stock rules, and regional warehouse allocation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, or category..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:outline-hidden"
          />
        </form>

        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          {/* Category Filter */}
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden"
          >
            {categories.map(c => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          {/* Warehouse Filter */}
          <select
            value={warehouseId}
            onChange={e => setWarehouseId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="All">All Warehouses</option>
            {warehouses.map(w => (
              <option key={w._id} value={w._id}>
                {w.name} ({w.warehouseCode})
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={stockStatus}
            onChange={e => setStockStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="All">All Stock Levels</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="name_asc">Sort: Name (A-Z)</option>
            <option value="stock_asc">Sort: Stock (Lowest First)</option>
            <option value="stock_desc">Sort: Stock (Highest First)</option>
            <option value="price_asc">Sort: Price (Low to High)</option>
            <option value="price_desc">Sort: Price (High to Low)</option>
          </select>

          <button
            type="button"
            onClick={loadData}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-500"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mb-2" />
          <p className="text-xs font-semibold">Loading catalog items...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">No Products Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            No products match the selected criteria. Try adjusting your search keyword or clearing filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategory('All');
              setWarehouseId('All');
              setStockStatus('All');
            }}
            className="mt-4 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Warehouse & Supplier</th>
                  <th className="py-3 px-4 text-right">Pricing (Cost / Sell)</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {products.map(product => (
                  <tr key={product._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Details */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'}
                          alt={product.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate max-w-[220px]">{product.name}</p>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                            {product.sku}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-md font-medium text-[11px] bg-slate-100 text-slate-700">
                        {product.category}
                      </span>
                    </td>

                    {/* Warehouse & Supplier */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800 flex items-center gap-1">
                        <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                        {product.warehouseName}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        {product.supplierName}
                      </p>
                    </td>

                    {/* Pricing */}
                    <td className="py-3 px-4 text-right">
                      <p className="font-bold text-slate-900">${product.sellingPrice.toFixed(2)}</p>
                      <p className="text-[11px] text-slate-400 font-mono">Cost: ${product.purchasePrice.toFixed(2)}</p>
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-sm font-extrabold ${
                          product.currentStock === 0
                            ? 'text-rose-600'
                            : product.currentStock <= product.minimumStock
                            ? 'text-amber-600'
                            : 'text-slate-800'
                        }`}
                      >
                        {product.currentStock}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Min: {product.minimumStock}</span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      <StockBadge status={product.stockStatus} />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(product._id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => {
                              setActionError(null);
                              setDeletingProduct(product);
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Product (Admin)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map(product => (
            <div
              key={product._id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col"
            >
              <div className="h-44 relative bg-slate-100 overflow-hidden">
                <img
                  src={product.image || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400'}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute top-2.5 right-2.5">
                  <StockBadge status={product.stockStatus} />
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                      {product.sku}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">
                      {product.category}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mt-2 line-clamp-1">{product.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {product.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Stock Level</span>
                      <span className="font-bold text-slate-900">
                        {product.currentStock} units <span className="text-slate-400 font-normal">/ {product.minimumStock}</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Price</span>
                      <span className="font-extrabold text-blue-600 text-sm">
                        ${product.sellingPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleViewDetails(product._id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(product)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isAddModalOpen || editingProduct !== null}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? 'Edit Product Details' : 'Add New Product'}
        subtitle={editingProduct ? `Updating SKU ${editingProduct.sku}` : 'Register a new item into the central inventory database.'}
        maxWidth="xl"
      >
        {actionError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {actionError}
          </div>
        )}

        <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Smart Commercial Thermostat Pro"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">SKU (Stock Keeping Unit) *</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={e => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="SKU-THERM-01"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:border-blue-600 focus:outline-hidden uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
              >
                {categories.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purchase Cost ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.purchasePrice}
                onChange={e => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Selling Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.sellingPrice}
                onChange={e => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!editingProduct && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.currentStock}
                  onChange={e => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Minimum Stock Alert Level</label>
              <input
                type="number"
                min="0"
                required
                value={formData.minimumStock}
                onChange={e => setFormData({ ...formData, minimumStock: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Warehouse *</label>
              <select
                required
                value={formData.warehouseId}
                onChange={e => setFormData({ ...formData, warehouseId: e.target.value })}
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
              <label className="block font-semibold text-slate-700 mb-1">Primary Supplier *</label>
              <select
                required
                value={formData.supplierId}
                onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
              >
                {suppliers.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.companyName} ({s.paymentTerms})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Image URL (Optional)</label>
            <input
              type="url"
              value={formData.image}
              onChange={e => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description & Specifications</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Technical specs, dimensions, material, or storage notes..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingProduct(null);
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
              {isSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Product Details Drawer/Modal */}
      <Modal
        isOpen={viewingProduct !== null}
        onClose={() => setViewingProduct(null)}
        title={viewingProduct?.name || 'Product Details'}
        subtitle={`SKU: ${viewingProduct?.sku || ''}`}
        maxWidth="lg"
      >
        {viewingProduct && (
          <div className="space-y-4 text-xs">
            <div className="h-44 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={viewingProduct.image || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600'}
                alt={viewingProduct.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Stock Status</span>
                <StockBadge status={viewingProduct.stockStatus} />
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Current Stock</span>
                <span className="font-extrabold text-slate-900 text-base">{viewingProduct.currentStock}</span>
                <span className="text-slate-400 text-[10px]"> / min {viewingProduct.minimumStock}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Cost / Sell</span>
                <span className="font-bold text-slate-900">${viewingProduct.purchasePrice} / ${viewingProduct.sellingPrice}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Gross Margin</span>
                <span className="font-bold text-emerald-600 text-base">
                  {Math.round(((viewingProduct.sellingPrice - viewingProduct.purchasePrice) / viewingProduct.sellingPrice) * 100)}%
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div>
                <span className="text-slate-400 block text-[10px]">Warehouse Location</span>
                <span className="font-semibold text-slate-800">
                  {viewingProduct.warehouse?.name} ({viewingProduct.warehouse?.warehouseCode}) — {viewingProduct.warehouse?.location}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Primary Supplier</span>
                <span className="font-semibold text-slate-800">
                  {viewingProduct.supplier?.companyName} ({viewingProduct.supplier?.paymentTerms})
                </span>
              </div>
              {viewingProduct.description && (
                <div>
                  <span className="text-slate-400 block text-[10px]">Product Description</span>
                  <p className="text-slate-600 leading-relaxed mt-0.5">{viewingProduct.description}</p>
                </div>
              )}
            </div>

            {/* Movement History Preview */}
            <div>
              <h5 className="font-bold text-slate-900 mb-2">Recent Movements for this Product</h5>
              {viewingProduct.recentMovements?.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {viewingProduct.recentMovements.map((m: any) => (
                    <div key={m._id} className="p-2.5 flex items-center justify-between bg-white text-[11px]">
                      <div>
                        <span className="font-semibold text-slate-800">{m.movementType}</span>
                        <span className="text-slate-400 ml-2">{m.reason}</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity} units
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-xs italic">No stock movements recorded yet.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingProduct !== null}
        onClose={() => setDeletingProduct(null)}
        title="Confirm Deletion"
        subtitle="This action will permanently remove the SKU from the database."
        maxWidth="sm"
      >
        {actionError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {actionError}
          </div>
        )}

        <p className="text-xs text-slate-600 mb-4">
          Are you sure you want to delete <span className="font-bold text-slate-900">{deletingProduct?.name}</span> ({deletingProduct?.sku})?
          Products associated with active purchase orders cannot be deleted.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setDeletingProduct(null)}
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
            {isSubmitting ? 'Deleting...' : 'Delete SKU'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
