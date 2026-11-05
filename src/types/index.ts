export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  phone?: string;
  createdAt?: string;
}

export interface Product {
  _id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  image?: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  warehouseId: string;
  supplierId: string;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
  warehouseName?: string;
  warehouseCode?: string;
  supplierName?: string;
  createdAt: string;
}

export interface Warehouse {
  _id: string;
  name: string;
  warehouseCode: string;
  location: string;
  managerName: string;
  contactNumber: string;
  description: string;
  productCount?: number;
  totalUnits?: number;
  totalValuation?: number;
  createdAt: string;
}

export interface Supplier {
  _id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: string;
  productsCount?: number;
  totalOrdersCount?: number;
  totalDeliveredSpend?: number;
  createdAt: string;
}

export interface StockMovement {
  _id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  warehouseId: string;
  warehouseName?: string;
  warehouseCode?: string;
  movementType: 'Stock In' | 'Stock Out' | 'Adjustment';
  quantity: number;
  reason: string;
  performedBy: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  _id: string;
  poNumber: string;
  supplierId: string;
  supplierName?: string;
  warehouseId: string;
  warehouseName?: string;
  warehouseCode?: string;
  products: PurchaseOrderItem[];
  totalAmount: number;
  orderDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Ordered' | 'Received' | 'Rejected';
  createdBy: string;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  _id: string;
  saleNumber: string;
  customerName?: string;
  products: SaleItem[];
  totalAmount: number;
  saleDate: string;
  createdBy: string;
  notes?: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'low_stock' | 'out_of_stock' | 'po_approval' | 'po_delayed' | 'stock_received' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}
