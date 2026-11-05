import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// Types
export interface UserDoc {
  _id: string;
  name: string;
  email: string;
  password: string; // hashed
  role: 'admin' | 'staff';
  phone?: string;
  createdAt: string;
}

export interface ProductDoc {
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
  createdAt: string;
  updatedAt?: string;
}

export interface WarehouseDoc {
  _id: string;
  name: string;
  warehouseCode: string;
  location: string;
  managerName: string;
  contactNumber: string;
  description: string;
  createdAt: string;
}

export interface SupplierDoc {
  _id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: string;
  createdAt: string;
}

export interface StockMovementDoc {
  _id: string;
  productId: string;
  warehouseId: string;
  movementType: 'Stock In' | 'Stock Out' | 'Adjustment';
  quantity: number;
  reason: string;
  performedBy: string; // User ID or User Name
  createdAt: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrderDoc {
  _id: string;
  poNumber: string;
  supplierId: string;
  warehouseId: string;
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
  updatedAt?: string;
}

export interface SaleItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SaleDoc {
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

export interface NotificationDoc {
  _id: string;
  title: string;
  message: string;
  type: 'low_stock' | 'out_of_stock' | 'po_approval' | 'po_delayed' | 'stock_received' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: UserDoc[];
  products: ProductDoc[];
  warehouses: WarehouseDoc[];
  suppliers: SupplierDoc[];
  stockMovements: StockMovementDoc[];
  purchaseOrders: PurchaseOrderDoc[];
  sales: SaleDoc[];
  notifications: NotificationDoc[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Memory cache
let dbCache: DatabaseSchema | null = null;

// Helpers
function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

// Ensure data folder and file exist
function initDb(): DatabaseSchema {
  if (dbCache) return dbCache;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(data);
      return dbCache!;
    } catch (e) {
      console.error('Error reading db.json, re-seeding:', e);
    }
  }

  // Pre-seed realistic data
  const seed = createSeedData();
  saveDb(seed);
  dbCache = seed;
  return dbCache;
}

function saveDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    dbCache = data;
  } catch (err) {
    console.error('Failed to write db.json:', err);
  }
}

function createSeedData(): DatabaseSchema {
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const staffPasswordHash = bcrypt.hashSync('staff123', 10);

  const now = new Date();
  const dateOffset = (days: number) => {
    const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return d.toISOString();
  };
  const futureOffset = (days: number) => {
    const d = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return d.toISOString();
  };

  const users: UserDoc[] = [
    {
      _id: 'usr_admin_1',
      name: 'Sarah Jenkins',
      email: 'admin@supplysense.com',
      password: adminPasswordHash,
      role: 'admin',
      phone: '+1 (555) 234-5678',
      createdAt: dateOffset(60),
    },
    {
      _id: 'usr_staff_1',
      name: 'Alex Rivera',
      email: 'staff@supplysense.com',
      password: staffPasswordHash,
      role: 'staff',
      phone: '+1 (555) 876-5432',
      createdAt: dateOffset(45),
    },
  ];

  const warehouses: WarehouseDoc[] = [
    {
      _id: 'wh_1',
      name: 'Midwest Central Distribution',
      warehouseCode: 'WH-CHI-01',
      location: 'Chicago, IL',
      managerName: 'David Miller',
      contactNumber: '+1 (312) 555-0199',
      description: 'Primary Midwest distribution center equipped with climate-controlled bays.',
      createdAt: dateOffset(90),
    },
    {
      _id: 'wh_2',
      name: 'Pacific Logistics Hub',
      warehouseCode: 'WH-RNO-02',
      location: 'Reno, NV',
      managerName: 'Elena Rostova',
      contactNumber: '+1 (775) 555-0144',
      description: 'West coast fulfillment center with high-rack automated storage.',
      createdAt: dateOffset(85),
    },
    {
      _id: 'wh_3',
      name: 'East Coast Gateway Depot',
      warehouseCode: 'WH-EWR-03',
      location: 'Newark, NJ',
      managerName: 'Marcus Vance',
      contactNumber: '+1 (973) 555-0122',
      description: 'Seaport-adjacent facility handling rapid import and regional distribution.',
      createdAt: dateOffset(75),
    },
    {
      _id: 'wh_4',
      name: 'Southern Freight Terminal',
      warehouseCode: 'WH-DFW-04',
      location: 'Dallas, TX',
      managerName: 'Rachel Kim',
      contactNumber: '+1 (214) 555-0178',
      description: 'Southwest cross-docking terminal serving Gulf and Central regions.',
      createdAt: dateOffset(60),
    },
  ];

  const suppliers: SupplierDoc[] = [
    {
      _id: 'sup_1',
      name: 'Nexus Electronics Corp',
      companyName: 'Nexus Global Microelectronics',
      email: 'procurement@nexuselec.com',
      phone: '+1 (408) 555-9010',
      address: '2400 Technology Dr, San Jose, CA 95110',
      paymentTerms: 'Net 30',
      createdAt: dateOffset(120),
    },
    {
      _id: 'sup_2',
      name: 'Apex Industrial Parts Ltd',
      companyName: 'Apex Precision Technologies',
      email: 'sales@apexind.com',
      phone: '+1 (313) 555-4820',
      address: '1500 Assembly Blvd, Detroit, MI 48202',
      paymentTerms: 'Net 45',
      createdAt: dateOffset(110),
    },
    {
      _id: 'sup_3',
      name: 'Prime Packaging Solutions',
      companyName: 'Prime Eco-Pack Materials',
      email: 'orders@primepack.com',
      phone: '+1 (770) 555-3211',
      address: '880 Logistics Way, Atlanta, GA 30336',
      paymentTerms: 'Net 15',
      createdAt: dateOffset(105),
    },
    {
      _id: 'sup_4',
      name: 'Nordic Sensors & Automation',
      companyName: 'Nordic Automation Oy',
      email: 'orders@nordicsensors.io',
      phone: '+1 (617) 555-7760',
      address: '100 Innovation Sq, Cambridge, MA 02142',
      paymentTerms: 'Net 30',
      createdAt: dateOffset(95),
    },
    {
      _id: 'sup_5',
      name: 'Vanguard Power & Batteries',
      companyName: 'Vanguard Energy Storage Inc',
      email: 'b2b@vanguardpower.com',
      phone: '+1 (512) 555-8390',
      address: '4200 Energy Pkwy, Austin, TX 78728',
      paymentTerms: '2/10 Net 30',
      createdAt: dateOffset(80),
    },
  ];

  const products: ProductDoc[] = [
    {
      _id: 'prod_1',
      name: 'Smart Commercial Thermostat Pro',
      sku: 'SKU-THERM-01',
      category: 'Electronics',
      description: 'Dual-band Wi-Fi commercial thermostat with Modbus and BACnet support.',
      image: 'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=500&auto=format&fit=crop&q=80',
      purchasePrice: 85.00,
      sellingPrice: 159.00,
      currentStock: 48,
      minimumStock: 20,
      warehouseId: 'wh_1',
      supplierId: 'sup_1',
      createdAt: dateOffset(60),
    },
    {
      _id: 'prod_2',
      name: 'Wireless Industrial Barcode Scanner',
      sku: 'SKU-SCAN-02',
      category: 'Hardware',
      description: 'Rugged IP65 2D QR and barcode scanner with Bluetooth base station.',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=80',
      purchasePrice: 120.00,
      sellingPrice: 229.00,
      currentStock: 14,
      minimumStock: 25, // LOW STOCK
      warehouseId: 'wh_1',
      supplierId: 'sup_1',
      createdAt: dateOffset(55),
    },
    {
      _id: 'prod_3',
      name: 'Heavy-Duty 48x40 Shipping Pallet',
      sku: 'SKU-PALL-03',
      category: 'Logistics Supplies',
      description: 'Heat-treated ISPM-15 compliant hardwood export shipping pallets.',
      image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=500&auto=format&fit=crop&q=80',
      purchasePrice: 16.50,
      sellingPrice: 34.00,
      currentStock: 180,
      minimumStock: 50,
      warehouseId: 'wh_2',
      supplierId: 'sup_3',
      createdAt: dateOffset(50),
    },
    {
      _id: 'prod_4',
      name: 'Industrial IoT Vibration Sensor',
      sku: 'SKU-SENS-04',
      category: 'Sensors',
      description: 'Tri-axial wireless machine vibration and temperature predictive sensor.',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
      purchasePrice: 65.00,
      sellingPrice: 135.00,
      currentStock: 5,
      minimumStock: 15, // LOW STOCK
      warehouseId: 'wh_3',
      supplierId: 'sup_4',
      createdAt: dateOffset(45),
    },
    {
      _id: 'prod_5',
      name: '48V 100Ah Lithium Iron Phosphate Battery',
      sku: 'SKU-BATT-05',
      category: 'Power Systems',
      description: 'LiFePO4 modular rack-mountable energy storage unit with smart BMS.',
      image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=80',
      purchasePrice: 750.00,
      sellingPrice: 1290.00,
      currentStock: 8,
      minimumStock: 10, // LOW STOCK
      warehouseId: 'wh_4',
      supplierId: 'sup_5',
      createdAt: dateOffset(40),
    },
    {
      _id: 'prod_6',
      name: 'Direct Thermal Shipping Label Roll (4x6)',
      sku: 'SKU-LBL-06',
      category: 'Logistics Supplies',
      description: 'Pack of 12 rolls, 500 labels per roll, smudge-resistant adhesive.',
      image: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=500&auto=format&fit=crop&q=80',
      purchasePrice: 22.00,
      sellingPrice: 48.00,
      currentStock: 220,
      minimumStock: 40,
      warehouseId: 'wh_1',
      supplierId: 'sup_3',
      createdAt: dateOffset(38),
    },
    {
      _id: 'prod_7',
      name: 'USB-C Universal Quad 4K Docking Station',
      sku: 'SKU-DOCK-07',
      category: 'Electronics',
      description: '100W Power Delivery, dual HDMI, dual DP, 2.5GbE Ethernet workstation dock.',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
      purchasePrice: 95.00,
      sellingPrice: 189.00,
      currentStock: 32,
      minimumStock: 15,
      warehouseId: 'wh_2',
      supplierId: 'sup_1',
      createdAt: dateOffset(35),
    },
    {
      _id: 'prod_8',
      name: 'Hydraulic Pallet Jack 5500 lbs',
      sku: 'SKU-JACK-08',
      category: 'Hardware',
      description: 'Heavy duty polyurethane load wheels, reinforced ergonomic 3-position lever.',
      image: 'https://images.unsplash.com/photo-1586528116493-a029325540fa?w=500&auto=format&fit=crop&q=80',
      purchasePrice: 240.00,
      sellingPrice: 450.00,
      currentStock: 0,
      minimumStock: 4, // OUT OF STOCK
      warehouseId: 'wh_4',
      supplierId: 'sup_2',
      createdAt: dateOffset(32),
    },
    {
      _id: 'prod_9',
      name: 'UHF RFID Adhesive Tracking Tags (Pack of 500)',
      sku: 'SKU-RFID-09',
      category: 'Sensors',
      description: 'Monza R6 chip EPC Gen 2 compliant high-speed inventory tracking tags.',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80',
      purchasePrice: 45.00,
      sellingPrice: 95.00,
      currentStock: 75,
      minimumStock: 25,
      warehouseId: 'wh_3',
      supplierId: 'sup_4',
      createdAt: dateOffset(30),
    },
    {
      _id: 'prod_10',
      name: 'High-Torque Industrial Stepper Motor',
      sku: 'SKU-MTR-10',
      category: 'Hardware',
      description: 'NEMA 34 high precision bipolar stepper motor for CNC and conveyor feeds.',
      image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80',
      purchasePrice: 72.00,
      sellingPrice: 145.00,
      currentStock: 28,
      minimumStock: 12,
      warehouseId: 'wh_2',
      supplierId: 'sup_2',
      createdAt: dateOffset(25),
    },
    {
      _id: 'prod_11',
      name: 'Poly Bubble Mailers #5 (Box of 200)',
      sku: 'SKU-MAIL-11',
      category: 'Logistics Supplies',
      description: 'Tear-proof waterproof cushioned shipping mailers with tamper-evident seal.',
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=80',
      purchasePrice: 38.00,
      sellingPrice: 79.00,
      currentStock: 95,
      minimumStock: 30,
      warehouseId: 'wh_1',
      supplierId: 'sup_3',
      createdAt: dateOffset(22),
    },
    {
      _id: 'prod_12',
      name: '24V DC Switching Power Supply 480W',
      sku: 'SKU-PWR-12',
      category: 'Power Systems',
      description: 'DIN-rail mounted industrial SMPS with overload and surge protection.',
      image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=500&auto=format&fit=crop&q=80',
      purchasePrice: 58.00,
      sellingPrice: 119.00,
      currentStock: 3,
      minimumStock: 10, // LOW STOCK
      warehouseId: 'wh_3',
      supplierId: 'sup_5',
      createdAt: dateOffset(20),
    },
  ];

  // Stock movements
  const stockMovements: StockMovementDoc[] = [
    {
      _id: 'mv_1',
      productId: 'prod_1',
      warehouseId: 'wh_1',
      movementType: 'Stock In',
      quantity: 50,
      reason: 'Initial intake from PO-2026-001',
      performedBy: 'Sarah Jenkins',
      createdAt: dateOffset(28),
    },
    {
      _id: 'mv_2',
      productId: 'prod_2',
      warehouseId: 'wh_1',
      movementType: 'Stock In',
      quantity: 25,
      reason: 'Shipment received from Nexus Electronics',
      performedBy: 'Alex Rivera',
      createdAt: dateOffset(26),
    },
    {
      _id: 'mv_3',
      productId: 'prod_2',
      warehouseId: 'wh_1',
      movementType: 'Stock Out',
      quantity: 11,
      reason: 'Sale order fulfilled: SO-2026-102',
      performedBy: 'Alex Rivera',
      createdAt: dateOffset(12),
    },
    {
      _id: 'mv_4',
      productId: 'prod_3',
      warehouseId: 'wh_2',
      movementType: 'Stock In',
      quantity: 200,
      reason: 'Bulk delivery PO-2026-002',
      performedBy: 'David Miller',
      createdAt: dateOffset(20),
    },
    {
      _id: 'mv_5',
      productId: 'prod_4',
      warehouseId: 'wh_3',
      movementType: 'Adjustment',
      quantity: -3,
      reason: 'Quality inspection found damaged packaging',
      performedBy: 'Sarah Jenkins',
      createdAt: dateOffset(15),
    },
    {
      _id: 'mv_6',
      productId: 'prod_5',
      warehouseId: 'wh_4',
      movementType: 'Stock In',
      quantity: 12,
      reason: 'Direct freight delivery from Vanguard Power',
      performedBy: 'Rachel Kim',
      createdAt: dateOffset(14),
    },
    {
      _id: 'mv_7',
      productId: 'prod_5',
      warehouseId: 'wh_4',
      movementType: 'Stock Out',
      quantity: 4,
      reason: 'Solar installation client order fulfilled',
      performedBy: 'Alex Rivera',
      createdAt: dateOffset(5),
    },
    {
      _id: 'mv_8',
      productId: 'prod_8',
      warehouseId: 'wh_4',
      movementType: 'Stock Out',
      quantity: 5,
      reason: 'Warehouse transfer and client sales zeroed stock',
      performedBy: 'Sarah Jenkins',
      createdAt: dateOffset(3),
    },
  ];

  // Purchase Orders
  const purchaseOrders: PurchaseOrderDoc[] = [
    {
      _id: 'po_1',
      poNumber: 'PO-2026-1001',
      supplierId: 'sup_1',
      warehouseId: 'wh_1',
      products: [
        { productId: 'prod_1', productName: 'Smart Commercial Thermostat Pro', quantity: 30, unitPrice: 85.00, total: 2550.00 },
        { productId: 'prod_2', productName: 'Wireless Industrial Barcode Scanner', quantity: 20, unitPrice: 120.00, total: 2400.00 }
      ],
      totalAmount: 4950.00,
      orderDate: dateOffset(30),
      expectedDeliveryDate: dateOffset(16),
      actualDeliveryDate: dateOffset(14), // Delivered 2 days early!
      status: 'Received',
      createdBy: 'Sarah Jenkins',
      approvedBy: 'Sarah Jenkins',
      notes: 'Delivered in excellent condition ahead of schedule.',
      createdAt: dateOffset(30),
    },
    {
      _id: 'po_2',
      poNumber: 'PO-2026-1002',
      supplierId: 'sup_3',
      warehouseId: 'wh_1',
      products: [
        { productId: 'prod_6', productName: 'Direct Thermal Shipping Label Roll (4x6)', quantity: 100, unitPrice: 22.00, total: 2200.00 },
        { productId: 'prod_11', productName: 'Poly Bubble Mailers #5 (Box of 200)', quantity: 50, unitPrice: 38.00, total: 1900.00 }
      ],
      totalAmount: 4100.00,
      orderDate: dateOffset(22),
      expectedDeliveryDate: dateOffset(12),
      actualDeliveryDate: dateOffset(10),
      status: 'Received',
      createdBy: 'Alex Rivera',
      approvedBy: 'Sarah Jenkins',
      notes: 'Packaging restock received and shelved in Bay A4.',
      createdAt: dateOffset(22),
    },
    {
      _id: 'po_3',
      poNumber: 'PO-2026-1003',
      supplierId: 'sup_2',
      warehouseId: 'wh_4',
      products: [
        { productId: 'prod_8', productName: 'Hydraulic Pallet Jack 5500 lbs', quantity: 6, unitPrice: 240.00, total: 1440.00 }
      ],
      totalAmount: 1440.00,
      orderDate: dateOffset(18),
      expectedDeliveryDate: dateOffset(4), // Overdue by 4 days!
      status: 'Ordered',
      createdBy: 'Alex Rivera',
      approvedBy: 'Sarah Jenkins',
      notes: 'Supplier shipment delayed due to axle component backorder.',
      createdAt: dateOffset(18),
    },
    {
      _id: 'po_4',
      poNumber: 'PO-2026-1004',
      supplierId: 'sup_4',
      warehouseId: 'wh_3',
      products: [
        { productId: 'prod_4', productName: 'Industrial IoT Vibration Sensor', quantity: 25, unitPrice: 65.00, total: 1625.00 },
        { productId: 'prod_9', productName: 'UHF RFID Adhesive Tracking Tags (Pack of 500)', quantity: 40, unitPrice: 45.00, total: 1800.00 }
      ],
      totalAmount: 3425.00,
      orderDate: dateOffset(8),
      expectedDeliveryDate: futureOffset(5),
      status: 'Approved',
      createdBy: 'Alex Rivera',
      approvedBy: 'Sarah Jenkins',
      notes: 'Sensors restock approved; supplier confirmed production slot.',
      createdAt: dateOffset(8),
    },
    {
      _id: 'po_5',
      poNumber: 'PO-2026-1005',
      supplierId: 'sup_5',
      warehouseId: 'wh_4',
      products: [
        { productId: 'prod_5', productName: '48V 100Ah Lithium Iron Phosphate Battery', quantity: 10, unitPrice: 750.00, total: 7500.00 }
      ],
      totalAmount: 7500.00,
      orderDate: dateOffset(2),
      expectedDeliveryDate: futureOffset(10),
      status: 'Pending Approval',
      createdBy: 'Alex Rivera',
      notes: 'Staff requested urgent battery restock for new enterprise client.',
      createdAt: dateOffset(2),
    },
    {
      _id: 'po_6',
      poNumber: 'PO-2026-1006',
      supplierId: 'sup_1',
      warehouseId: 'wh_2',
      products: [
        { productId: 'prod_7', productName: 'USB-C Universal Quad 4K Docking Station', quantity: 30, unitPrice: 95.00, total: 2850.00 }
      ],
      totalAmount: 2850.00,
      orderDate: dateOffset(1),
      expectedDeliveryDate: futureOffset(8),
      status: 'Draft',
      createdBy: 'Sarah Jenkins',
      notes: 'Draft order being prepared for Q4 replenishment.',
      createdAt: dateOffset(1),
    },
  ];

  // Sales records across the last 30 days
  const sales: SaleDoc[] = [
    {
      _id: 'sale_1',
      saleNumber: 'SO-2026-081',
      customerName: 'Metro Transit Authorities',
      products: [
        { productId: 'prod_1', productName: 'Smart Commercial Thermostat Pro', quantity: 6, unitPrice: 159.00, total: 954.00 },
        { productId: 'prod_4', productName: 'Industrial IoT Vibration Sensor', quantity: 8, unitPrice: 135.00, total: 1080.00 }
      ],
      totalAmount: 2034.00,
      saleDate: dateOffset(28),
      createdBy: 'Sarah Jenkins',
      notes: 'Depot automation upgrade phase 1.',
      createdAt: dateOffset(28),
    },
    {
      _id: 'sale_2',
      saleNumber: 'SO-2026-082',
      customerName: 'Pioneer Logistics LLC',
      products: [
        { productId: 'prod_2', productName: 'Wireless Industrial Barcode Scanner', quantity: 5, unitPrice: 229.00, total: 1145.00 },
        { productId: 'prod_6', productName: 'Direct Thermal Shipping Label Roll (4x6)', quantity: 20, unitPrice: 48.00, total: 960.00 }
      ],
      totalAmount: 2105.00,
      saleDate: dateOffset(25),
      createdBy: 'Alex Rivera',
      notes: 'New sorting facility outfitting.',
      createdAt: dateOffset(25),
    },
    {
      _id: 'sale_3',
      saleNumber: 'SO-2026-083',
      customerName: 'AeroTech Systems Inc',
      products: [
        { productId: 'prod_5', productName: '48V 100Ah Lithium Iron Phosphate Battery', quantity: 2, unitPrice: 1290.00, total: 2580.00 },
        { productId: 'prod_12', productName: '24V DC Switching Power Supply 480W', quantity: 4, unitPrice: 119.00, total: 476.00 }
      ],
      totalAmount: 3056.00,
      saleDate: dateOffset(22),
      createdBy: 'Sarah Jenkins',
      notes: 'Hangar backup power array.',
      createdAt: dateOffset(22),
    },
    {
      _id: 'sale_4',
      saleNumber: 'SO-2026-084',
      customerName: 'Swift Fulfillment Hub',
      products: [
        { productId: 'prod_3', productName: 'Heavy-Duty 48x40 Shipping Pallet', quantity: 40, unitPrice: 34.00, total: 1360.00 },
        { productId: 'prod_11', productName: 'Poly Bubble Mailers #5 (Box of 200)', quantity: 15, unitPrice: 79.00, total: 1185.00 }
      ],
      totalAmount: 2545.00,
      saleDate: dateOffset(19),
      createdBy: 'Alex Rivera',
      notes: 'Bi-weekly packaging supply contract.',
      createdAt: dateOffset(19),
    },
    {
      _id: 'sale_5',
      saleNumber: 'SO-2026-085',
      customerName: 'CloudScale Data Centers',
      products: [
        { productId: 'prod_7', productName: 'USB-C Universal Quad 4K Docking Station', quantity: 12, unitPrice: 189.00, total: 2268.00 }
      ],
      totalAmount: 2268.00,
      saleDate: dateOffset(16),
      createdBy: 'Sarah Jenkins',
      notes: 'Engineering team desk rollout.',
      createdAt: dateOffset(16),
    },
    {
      _id: 'sale_6',
      saleNumber: 'SO-2026-086',
      customerName: 'Titan Manufacturing Corp',
      products: [
        { productId: 'prod_10', productName: 'High-Torque Industrial Stepper Motor', quantity: 8, unitPrice: 145.00, total: 1160.00 },
        { productId: 'prod_4', productName: 'Industrial IoT Vibration Sensor', quantity: 4, unitPrice: 135.00, total: 540.00 }
      ],
      totalAmount: 1700.00,
      saleDate: dateOffset(12),
      createdBy: 'Alex Rivera',
      notes: 'Assembly line motor replacement.',
      createdAt: dateOffset(12),
    },
    {
      _id: 'sale_7',
      saleNumber: 'SO-2026-087',
      customerName: 'BlueSky Logistics',
      products: [
        { productId: 'prod_2', productName: 'Wireless Industrial Barcode Scanner', quantity: 6, unitPrice: 229.00, total: 1374.00 },
        { productId: 'prod_9', productName: 'UHF RFID Adhesive Tracking Tags (Pack of 500)', quantity: 10, unitPrice: 95.00, total: 950.00 }
      ],
      totalAmount: 2324.00,
      saleDate: dateOffset(8),
      createdBy: 'Sarah Jenkins',
      notes: 'Handheld scanner upgrade across dock.',
      createdAt: dateOffset(8),
    },
    {
      _id: 'sale_8',
      saleNumber: 'SO-2026-088',
      customerName: 'Solaria Microgrids',
      products: [
        { productId: 'prod_5', productName: '48V 100Ah Lithium Iron Phosphate Battery', quantity: 2, unitPrice: 1290.00, total: 2580.00 }
      ],
      totalAmount: 2580.00,
      saleDate: dateOffset(4),
      createdBy: 'Alex Rivera',
      notes: 'Off-grid agricultural pump installation.',
      createdAt: dateOffset(4),
    },
    {
      _id: 'sale_9',
      saleNumber: 'SO-2026-089',
      customerName: 'Omni Retailers Group',
      products: [
        { productId: 'prod_1', productName: 'Smart Commercial Thermostat Pro', quantity: 4, unitPrice: 159.00, total: 636.00 },
        { productId: 'prod_6', productName: 'Direct Thermal Shipping Label Roll (4x6)', quantity: 15, unitPrice: 48.00, total: 720.00 }
      ],
      totalAmount: 1356.00,
      saleDate: dateOffset(1),
      createdBy: 'Sarah Jenkins',
      notes: 'Storefront retrofits.',
      createdAt: dateOffset(1),
    },
  ];

  // In-app Notifications
  const notifications: NotificationDoc[] = [
    {
      _id: 'notif_1',
      title: 'Critical Out-of-Stock Alert',
      message: 'Hydraulic Pallet Jack 5500 lbs (SKU-JACK-08) is at 0 units in Southern Freight Terminal.',
      type: 'out_of_stock',
      isRead: false,
      link: '/products',
      createdAt: dateOffset(1),
    },
    {
      _id: 'notif_2',
      title: 'Pending Purchase Order Approval',
      message: 'Alex Rivera submitted PO-2026-1005 ($7,500.00 for Lithium Batteries) awaiting admin approval.',
      type: 'po_approval',
      isRead: false,
      link: '/purchase-orders',
      createdAt: dateOffset(2),
    },
    {
      _id: 'notif_3',
      title: 'Supplier Delivery Delayed',
      message: 'PO-2026-1003 from Apex Industrial Parts Ltd is overdue by 4 days.',
      type: 'po_delayed',
      isRead: false,
      link: '/purchase-orders',
      createdAt: dateOffset(3),
    },
    {
      _id: 'notif_4',
      title: 'Low Stock Warning',
      message: 'Industrial IoT Vibration Sensor (SKU-SENS-04) has only 5 units remaining (min 15).',
      type: 'low_stock',
      isRead: true,
      link: '/products',
      createdAt: dateOffset(4),
    },
  ];

  return {
    users,
    warehouses,
    suppliers,
    products,
    stockMovements,
    purchaseOrders,
    sales,
    notifications,
  };
}

// Database query repository
export const db = {
  // Direct access for raw queries
  get data(): DatabaseSchema {
    return initDb();
  },

  save(): void {
    if (dbCache) {
      saveDb(dbCache);
    }
  },

  // USERS
  users: {
    find: (filter?: Partial<UserDoc>) => {
      const all = db.data.users;
      if (!filter) return all;
      return all.filter(u => Object.entries(filter).every(([k, v]) => (u as any)[k] === v));
    },
    findOne: (filter: Partial<UserDoc>) => {
      const all = db.data.users;
      return all.find(u => Object.entries(filter).every(([k, v]) => (u as any)[k] === v)) || null;
    },
    findById: (id: string) => {
      return db.data.users.find(u => u._id === id) || null;
    },
    create: (data: Omit<UserDoc, '_id' | 'createdAt'>) => {
      const doc: UserDoc = {
        _id: generateId('usr'),
        createdAt: new Date().toISOString(),
        ...data,
      };
      db.data.users.push(doc);
      db.save();
      return doc;
    },
    findByIdAndUpdate: (id: string, update: Partial<UserDoc>) => {
      const idx = db.data.users.findIndex(u => u._id === id);
      if (idx === -1) return null;
      db.data.users[idx] = { ...db.data.users[idx], ...update };
      db.save();
      return db.data.users[idx];
    },
  },

  // PRODUCTS
  products: {
    find: (filter?: any) => {
      let list = [...db.data.products];
      if (filter) {
        if (filter.category) list = list.filter(p => p.category === filter.category);
        if (filter.warehouseId) list = list.filter(p => p.warehouseId === filter.warehouseId);
        if (filter.supplierId) list = list.filter(p => p.supplierId === filter.supplierId);
        if (filter.search) {
          const q = filter.search.toLowerCase();
          list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
        }
      }
      return list;
    },
    findById: (id: string) => {
      return db.data.products.find(p => p._id === id) || null;
    },
    findOne: (filter: Partial<ProductDoc>) => {
      return db.data.products.find(p => Object.entries(filter).every(([k, v]) => (p as any)[k] === v)) || null;
    },
    create: (data: Omit<ProductDoc, '_id' | 'createdAt'>) => {
      const doc: ProductDoc = {
        _id: generateId('prod'),
        createdAt: new Date().toISOString(),
        ...data,
      };
      db.data.products.push(doc);
      db.save();
      return doc;
    },
    findByIdAndUpdate: (id: string, update: Partial<ProductDoc>) => {
      const idx = db.data.products.findIndex(p => p._id === id);
      if (idx === -1) return null;
      db.data.products[idx] = { ...db.data.products[idx], ...update, updatedAt: new Date().toISOString() };
      db.save();
      return db.data.products[idx];
    },
    findByIdAndDelete: (id: string) => {
      const idx = db.data.products.findIndex(p => p._id === id);
      if (idx === -1) return false;
      db.data.products.splice(idx, 1);
      db.save();
      return true;
    },
    count: () => db.data.products.length,
  },

  // WAREHOUSES
  warehouses: {
    find: () => [...db.data.warehouses],
    findById: (id: string) => db.data.warehouses.find(w => w._id === id) || null,
    findOne: (filter: Partial<WarehouseDoc>) => db.data.warehouses.find(w => Object.entries(filter).every(([k, v]) => (w as any)[k] === v)) || null,
    create: (data: Omit<WarehouseDoc, '_id' | 'createdAt'>) => {
      const doc: WarehouseDoc = {
        _id: generateId('wh'),
        createdAt: new Date().toISOString(),
        ...data,
      };
      db.data.warehouses.push(doc);
      db.save();
      return doc;
    },
    findByIdAndUpdate: (id: string, update: Partial<WarehouseDoc>) => {
      const idx = db.data.warehouses.findIndex(w => w._id === id);
      if (idx === -1) return null;
      db.data.warehouses[idx] = { ...db.data.warehouses[idx], ...update };
      db.save();
      return db.data.warehouses[idx];
    },
    findByIdAndDelete: (id: string) => {
      const idx = db.data.warehouses.findIndex(w => w._id === id);
      if (idx === -1) return false;
      db.data.warehouses.splice(idx, 1);
      db.save();
      return true;
    },
  },

  // SUPPLIERS
  suppliers: {
    find: () => [...db.data.suppliers],
    findById: (id: string) => db.data.suppliers.find(s => s._id === id) || null,
    findOne: (filter: Partial<SupplierDoc>) => db.data.suppliers.find(s => Object.entries(filter).every(([k, v]) => (s as any)[k] === v)) || null,
    create: (data: Omit<SupplierDoc, '_id' | 'createdAt'>) => {
      const doc: SupplierDoc = {
        _id: generateId('sup'),
        createdAt: new Date().toISOString(),
        ...data,
      };
      db.data.suppliers.push(doc);
      db.save();
      return doc;
    },
    findByIdAndUpdate: (id: string, update: Partial<SupplierDoc>) => {
      const idx = db.data.suppliers.findIndex(s => s._id === id);
      if (idx === -1) return null;
      db.data.suppliers[idx] = { ...db.data.suppliers[idx], ...update };
      db.save();
      return db.data.suppliers[idx];
    },
    findByIdAndDelete: (id: string) => {
      const idx = db.data.suppliers.findIndex(s => s._id === id);
      if (idx === -1) return false;
      db.data.suppliers.splice(idx, 1);
      db.save();
      return true;
    },
  },

  // STOCK MOVEMENTS
  stockMovements: {
    find: (filter?: any) => {
      let list = [...db.data.stockMovements];
      if (filter) {
        if (filter.productId) list = list.filter(m => m.productId === filter.productId);
        if (filter.warehouseId) list = list.filter(m => m.warehouseId === filter.warehouseId);
        if (filter.movementType) list = list.filter(m => m.movementType === filter.movementType);
      }
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    create: (data: Omit<StockMovementDoc, '_id' | 'createdAt'>) => {
      const doc: StockMovementDoc = {
        _id: generateId('mv'),
        createdAt: new Date().toISOString(),
        ...data,
      };
      db.data.stockMovements.push(doc);
      db.save();
      return doc;
    },
  },

  // PURCHASE ORDERS
  purchaseOrders: {
    find: (filter?: any) => {
      let list = [...db.data.purchaseOrders];
      if (filter) {
        if (filter.status) list = list.filter(po => po.status === filter.status);
        if (filter.supplierId) list = list.filter(po => po.supplierId === filter.supplierId);
        if (filter.warehouseId) list = list.filter(po => po.warehouseId === filter.warehouseId);
      }
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    findById: (id: string) => db.data.purchaseOrders.find(po => po._id === id) || null,
    create: (data: Omit<PurchaseOrderDoc, '_id' | 'createdAt' | 'poNumber'> & { poNumber?: string }) => {
      const count = db.data.purchaseOrders.length + 1001;
      const doc: PurchaseOrderDoc = {
        _id: generateId('po'),
        poNumber: data.poNumber || `PO-2026-${count}`,
        createdAt: new Date().toISOString(),
        ...data,
      };
      db.data.purchaseOrders.push(doc);
      db.save();
      return doc;
    },
    findByIdAndUpdate: (id: string, update: Partial<PurchaseOrderDoc>) => {
      const idx = db.data.purchaseOrders.findIndex(po => po._id === id);
      if (idx === -1) return null;
      db.data.purchaseOrders[idx] = { ...db.data.purchaseOrders[idx], ...update, updatedAt: new Date().toISOString() };
      db.save();
      return db.data.purchaseOrders[idx];
    },
    findByIdAndDelete: (id: string) => {
      const idx = db.data.purchaseOrders.findIndex(po => po._id === id);
      if (idx === -1) return false;
      db.data.purchaseOrders.splice(idx, 1);
      db.save();
      return true;
    },
  },

  // SALES
  sales: {
    find: () => {
      return [...db.data.sales].sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
    },
    findById: (id: string) => db.data.sales.find(s => s._id === id) || null,
    create: (data: Omit<SaleDoc, '_id' | 'createdAt' | 'saleNumber'> & { saleNumber?: string }) => {
      const count = db.data.sales.length + 90;
      const doc: SaleDoc = {
        _id: generateId('sale'),
        saleNumber: data.saleNumber || `SO-2026-0${count}`,
        createdAt: new Date().toISOString(),
        ...data,
      };
      db.data.sales.push(doc);
      db.save();
      return doc;
    },
  },

  // NOTIFICATIONS
  notifications: {
    find: () => {
      return [...db.data.notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    findByIdAndUpdate: (id: string, update: Partial<NotificationDoc>) => {
      const idx = db.data.notifications.findIndex(n => n._id === id);
      if (idx === -1) return null;
      db.data.notifications[idx] = { ...db.data.notifications[idx], ...update };
      db.save();
      return db.data.notifications[idx];
    },
    markAllRead: () => {
      db.data.notifications.forEach(n => { n.isRead = true; });
      db.save();
      return true;
    },
    create: (data: Omit<NotificationDoc, '_id' | 'createdAt'>) => {
      const doc: NotificationDoc = {
        _id: generateId('notif'),
        createdAt: new Date().toISOString(),
        ...data,
      };
      db.data.notifications.unshift(doc);
      db.save();
      return doc;
    },
  },
};
