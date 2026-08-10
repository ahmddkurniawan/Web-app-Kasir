export type UserRole = 'ADMIN' | 'OWNER';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export type ProductCategory = 
  | 'Coffee'
  | 'Non Coffee'
  | 'Tea'
  | 'Food'
  | 'Snack'
  | 'Dessert'
  | 'Other';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  price: number;
  cost: number; // HPP (Harga Pokok Penjualan)
  stock: number;
  minStock: number;
  unit: string;
  imageUrl: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
  notes?: string;
}

export type PaymentMethod = 
  | 'Cash'
  | 'QRIS'
  | 'Transfer'
  | 'E-Wallet'
  | 'Debit'
  | 'Credit Card';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface TransactionItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  category: ProductCategory;
  price: number;
  cost: number;
  quantity: number;
  subtotal: number;
  notes?: string;
}

export interface Transaction {
  localId: string; // ID lokal dari IndexedDB
  serverId?: string; // ID dari backend setelah disinkronkan
  transactionNumber: string; // e.g. TRX-20260810-001
  deviceId: string;
  deviceName: string;
  adminId: string;
  adminName: string;
  transactionDate: string; // ISO string
  items: TransactionItem[];
  subtotal: number;
  discount: number; // Diskon dalam Rupiah
  discountPercentage?: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashAmount?: number;
  changeAmount?: number;
  syncStatus: SyncStatus;
  createdAt: string;
  syncedAt?: string;
  syncError?: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'SALE';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  adminName: string;
  timestamp: string;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  lastActive: string;
  status: 'ONLINE' | 'OFFLINE';
  pendingSyncCount: number;
  ipAddress?: string;
}

export interface OwnerAnalytics {
  todayRevenue: number;
  todayTransactions: number;
  todayItemsSold: number;
  averageOrderValue: number;
  revenueChangePercent: number; // vs yesterday
  topProducts: {
    productId: string;
    productName: string;
    category: ProductCategory;
    qtySold: number;
    revenue: number;
    percentageContribution: number;
  }[];
  salesByCategory: {
    category: ProductCategory;
    revenue: number;
    qtySold: number;
  }[];
  salesByHour: {
    hour: string; // e.g. "08:00", "09:00"
    revenue: number;
    transactions: number;
  }[];
  paymentDistribution: {
    method: PaymentMethod;
    count: number;
    amount: number;
  }[];
  cashierPerformance: {
    adminId: string;
    adminName: string;
    transactionCount: number;
    revenue: number;
    averageTransaction: number;
  }[];
  businessInsights: string[];
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  receiptFooter: string;
  taxRatePercent: number;
  enableThermalPrinter: boolean;
  thermalPaperWidth: '58mm' | '80mm';
}
