import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Product, Transaction, InventoryMovement, DeviceInfo, User } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent storage setup in data/db.json
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface ServerDB {
  users: User[];
  products: Product[];
  transactions: Transaction[];
  inventoryMovements: InventoryMovement[];
  devices: DeviceInfo[];
}

const DEFAULT_USERS: User[] = [
  {
    id: 'usr-admin-1',
    username: 'admin',
    name: 'Ahmad Kasir',
    email: 'kasir@cafengopay.id',
    role: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-admin-2',
    username: 'kasir2',
    name: 'Budi Kasir 2',
    email: 'kasir2@cafengopay.id',
    role: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-owner-1',
    username: 'owner',
    name: 'Pak Hendra (Owner)',
    email: 'owner@cafengopay.id',
    role: 'OWNER',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  }
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'CF-GLA',
    name: 'Kopi Gula Aren',
    category: 'Coffee',
    price: 22000,
    cost: 8000,
    stock: 45,
    minStock: 10,
    unit: 'cup',
    imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-2',
    sku: 'CF-ESP',
    name: 'Espresso Double Shot',
    category: 'Coffee',
    price: 18000,
    cost: 5000,
    stock: 60,
    minStock: 10,
    unit: 'cup',
    imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-3',
    sku: 'CF-LAT',
    name: 'Caramel Macchiato',
    category: 'Coffee',
    price: 28000,
    cost: 11000,
    stock: 30,
    minStock: 8,
    unit: 'cup',
    imageUrl: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-4',
    sku: 'CF-AMC',
    name: 'Iced Americano',
    category: 'Coffee',
    price: 20000,
    cost: 6000,
    stock: 50,
    minStock: 10,
    unit: 'cup',
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-5',
    sku: 'NC-MAT',
    name: 'Matcha Latte',
    category: 'Non Coffee',
    price: 26000,
    cost: 10000,
    stock: 25,
    minStock: 5,
    unit: 'cup',
    imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-6',
    sku: 'NC-CHO',
    name: 'Signature Chocolate',
    category: 'Non Coffee',
    price: 25000,
    cost: 9000,
    stock: 28,
    minStock: 5,
    unit: 'cup',
    imageUrl: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-7',
    sku: 'TE-EGR',
    name: 'Earl Grey Milk Tea',
    category: 'Tea',
    price: 22000,
    cost: 7000,
    stock: 35,
    minStock: 8,
    unit: 'cup',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-8',
    sku: 'FD-CRS',
    name: 'Butter Croissant',
    category: 'Food',
    price: 24000,
    cost: 9000,
    stock: 12,
    minStock: 5,
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-9',
    sku: 'SN-TST',
    name: 'Roti Bakar Kaya Butter',
    category: 'Snack',
    price: 20000,
    cost: 7000,
    stock: 4, // low stock threshold test!
    minStock: 5,
    unit: 'portion',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-10',
    sku: 'DS-WFL',
    name: 'Belgian Waffle Ice Cream',
    category: 'Dessert',
    price: 32000,
    cost: 13000,
    stock: 15,
    minStock: 5,
    unit: 'portion',
    imageUrl: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function loadDB(): ServerDB {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading db.json, creating initial state:', err);
  }

  const initialDB: ServerDB = {
    users: DEFAULT_USERS,
    products: DEFAULT_PRODUCTS,
    transactions: [],
    inventoryMovements: [],
    devices: [
      {
        deviceId: 'DEV-KASIR1',
        deviceName: 'Laptop Kasir 1',
        lastActive: new Date().toISOString(),
        status: 'ONLINE',
        pendingSyncCount: 0
      },
      {
        deviceId: 'DEV-TAB2',
        deviceName: 'Tablet Kasir 2',
        lastActive: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        status: 'OFFLINE',
        pendingSyncCount: 2
      }
    ]
  };

  saveDB(initialDB);
  return initialDB;
}

function saveDB(dbData: ServerDB) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

const dbData = loadDB();

// ---------------------- API ROUTES ----------------------

// Auth Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
  }

  // Simple demo authentication logic
  const user = dbData.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  
  if (!user || password !== 'password123') {
    return res.status(401).json({ 
      success: false, 
      message: 'Username atau password salah (Demo hint: admin / password123 atau owner / password123)' 
    });
  }

  res.json({
    success: true,
    user,
    token: `demo-token-${user.id}-${Date.now()}`
  });
});

// Products List
app.get('/api/products', (req, res) => {
  res.json({ success: true, products: dbData.products });
});

// Save or Update Product
app.post('/api/products', (req, res) => {
  const newProduct: Product = {
    ...req.body,
    id: req.body.id || `prod-${Date.now()}`,
    createdAt: req.body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const existingIdx = dbData.products.findIndex(p => p.id === newProduct.id);
  if (existingIdx >= 0) {
    dbData.products[existingIdx] = newProduct;
  } else {
    dbData.products.push(newProduct);
  }

  saveDB(dbData);
  res.json({ success: true, product: newProduct });
});

// Sync Offline Transactions (Idempotent sync queue handler)
app.post('/api/sync/transactions', (req, res) => {
  const { transactions, deviceId, deviceName } = req.body;

  if (!Array.isArray(transactions)) {
    return res.status(400).json({ success: false, message: 'Invalid payload, array expected' });
  }

  const results: { localId: string; serverId: string; syncStatus: 'synced' | 'failed'; error?: string }[] = [];

  for (const trx of transactions as Transaction[]) {
    try {
      // Check for duplicate transaction by transactionNumber or localId
      const existing = dbData.transactions.find(
        t => t.transactionNumber === trx.transactionNumber || (t.localId === trx.localId && t.deviceId === trx.deviceId)
      );

      if (existing) {
        // Already processed earlier
        results.push({
          localId: trx.localId,
          serverId: existing.serverId || existing.localId,
          syncStatus: 'synced'
        });
        continue;
      }

      const serverId = `srv-trx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const syncedTrx: Transaction = {
        ...trx,
        serverId,
        syncStatus: 'synced',
        syncedAt: new Date().toISOString()
      };

      // Save to server database
      dbData.transactions.push(syncedTrx);

      // Deduct stock from server inventory
      if (Array.isArray(trx.items)) {
        trx.items.forEach(item => {
          const product = dbData.products.find(p => p.id === item.productId);
          if (product) {
            const prevStock = product.stock;
            product.stock = Math.max(0, product.stock - item.quantity);
            product.updatedAt = new Date().toISOString();

            // Record inventory movement
            dbData.inventoryMovements.push({
              id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              productId: product.id,
              productName: product.name,
              type: 'SALE',
              quantity: item.quantity,
              previousStock: prevStock,
              newStock: product.stock,
              reason: `Penjualan kasir (${trx.transactionNumber})`,
              adminName: trx.adminName,
              timestamp: new Date().toISOString()
            });
          }
        });
      }

      results.push({
        localId: trx.localId,
        serverId,
        syncStatus: 'synced'
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown sync error';
      results.push({
        localId: trx.localId,
        serverId: '',
        syncStatus: 'failed',
        error: errorMessage
      });
    }
  }

  // Update or register device heartbeat
  if (deviceId) {
    const devIdx = dbData.devices.findIndex(d => d.deviceId === deviceId);
    const devEntry: DeviceInfo = {
      deviceId,
      deviceName: deviceName || 'Perangkat Kasir',
      lastActive: new Date().toISOString(),
      status: 'ONLINE',
      pendingSyncCount: 0
    };
    if (devIdx >= 0) {
      dbData.devices[devIdx] = devEntry;
    } else {
      dbData.devices.push(devEntry);
    }
  }

  saveDB(dbData);

  res.json({
    success: true,
    syncedCount: results.filter(r => r.syncStatus === 'synced').length,
    results
  });
});

// Device Heartbeat
app.post('/api/devices/heartbeat', (req, res) => {
  const { deviceId, deviceName, pendingSyncCount } = req.body;
  if (!deviceId) return res.status(400).json({ success: false });

  const idx = dbData.devices.findIndex(d => d.deviceId === deviceId);
  const entry: DeviceInfo = {
    deviceId,
    deviceName: deviceName || 'Kasir',
    lastActive: new Date().toISOString(),
    status: 'ONLINE',
    pendingSyncCount: pendingSyncCount || 0
  };

  if (idx >= 0) {
    dbData.devices[idx] = entry;
  } else {
    dbData.devices.push(entry);
  }

  saveDB(dbData);
  res.json({ success: true, devices: dbData.devices });
});

// Get Devices (Owner View)
app.get('/api/devices', (req, res) => {
  // Mark devices inactive for > 2 mins as OFFLINE
  const now = Date.now();
  const updatedDevices = dbData.devices.map(d => ({
    ...d,
    status: (now - new Date(d.lastActive).getTime() < 2 * 60 * 1000 ? 'ONLINE' : 'OFFLINE') as 'ONLINE' | 'OFFLINE'
  }));
  res.json({ success: true, devices: updatedDevices });
});

// Get Transactions (With filtering)
app.get('/api/transactions', (req, res) => {
  const { date, adminId, paymentMethod } = req.query;
  let list = [...dbData.transactions];

  if (date) {
    list = list.filter(t => t.transactionDate.startsWith(date as string));
  }
  if (adminId) {
    list = list.filter(t => t.adminId === adminId);
  }
  if (paymentMethod) {
    list = list.filter(t => t.paymentMethod === paymentMethod);
  }

  // Sort latest first
  list.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

  res.json({ success: true, transactions: list });
});

// Owner Business Analytics Endpoint
app.get('/api/owner/analytics', (req, res) => {
  const transactions = dbData.transactions;
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

  const todayTrxs = transactions.filter(t => t.transactionDate.startsWith(todayStr));
  const yesterdayTrxs = transactions.filter(t => t.transactionDate.startsWith(yesterdayStr));

  const todayRevenue = todayTrxs.reduce((sum, t) => sum + t.total, 0);
  const yesterdayRevenue = yesterdayTrxs.reduce((sum, t) => sum + t.total, 0);

  const revenueChangePercent = yesterdayRevenue > 0 
    ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
    : todayRevenue > 0 ? 100 : 0;

  const todayItemsSold = todayTrxs.reduce((sum, t) => {
    return sum + t.items.reduce((itemSum, i) => itemSum + i.quantity, 0);
  }, 0);

  const todayTransactions = todayTrxs.length;
  const averageOrderValue = todayTransactions > 0 ? Math.round(todayRevenue / todayTransactions) : 0;

  // Top products sales calculation
  const productSalesMap = new Map<string, { productName: string; category: any; qtySold: number; revenue: number }>();

  transactions.forEach(t => {
    t.items.forEach(item => {
      const existing = productSalesMap.get(item.productId) || {
        productName: item.productName,
        category: item.category,
        qtySold: 0,
        revenue: 0
      };
      existing.qtySold += item.quantity;
      existing.revenue += item.subtotal;
      productSalesMap.set(item.productId, existing);
    });
  });

  const totalAllRevenue = Array.from(productSalesMap.values()).reduce((sum, p) => sum + p.revenue, 0) || 1;

  const topProducts = Array.from(productSalesMap.entries())
    .map(([productId, val]) => ({
      productId,
      ...val,
      percentageContribution: Math.round((val.revenue / totalAllRevenue) * 100)
    }))
    .sort((a, b) => b.qtySold - a.qtySold)
    .slice(0, 10);

  // Sales by Category
  const categoryMap = new Map<string, { revenue: number; qtySold: number }>();
  transactions.forEach(t => {
    t.items.forEach(item => {
      const existing = categoryMap.get(item.category) || { revenue: 0, qtySold: 0 };
      existing.revenue += item.subtotal;
      existing.qtySold += item.quantity;
      categoryMap.set(item.category, existing);
    });
  });

  const salesByCategory = Array.from(categoryMap.entries()).map(([category, val]) => ({
    category: category as any,
    ...val
  }));

  // Sales by Hour
  const hourlyMap = new Map<string, { revenue: number; transactions: number }>();
  for (let h = 8; h <= 22; h++) {
    const hourLabel = `${h.toString().padStart(2, '0')}:00`;
    hourlyMap.set(hourLabel, { revenue: 0, transactions: 0 });
  }

  transactions.forEach(t => {
    const hour = new Date(t.transactionDate).getHours();
    const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
    if (hourlyMap.has(hourLabel)) {
      const entry = hourlyMap.get(hourLabel)!;
      entry.revenue += t.total;
      entry.transactions += 1;
    }
  });

  const salesByHour = Array.from(hourlyMap.entries()).map(([hour, val]) => ({
    hour,
    ...val
  }));

  // Payment Method Distribution
  const paymentMap = new Map<string, { count: number; amount: number }>();
  transactions.forEach(t => {
    const existing = paymentMap.get(t.paymentMethod) || { count: 0, amount: 0 };
    existing.count += 1;
    existing.amount += t.total;
    paymentMap.set(t.paymentMethod, existing);
  });

  const paymentDistribution = Array.from(paymentMap.entries()).map(([method, val]) => ({
    method: method as any,
    ...val
  }));

  // Cashier Performance
  const cashierMap = new Map<string, { adminName: string; count: number; revenue: number }>();
  transactions.forEach(t => {
    const existing = cashierMap.get(t.adminId) || { adminName: t.adminName || 'Admin Kasir', count: 0, revenue: 0 };
    existing.count += 1;
    existing.revenue += t.total;
    cashierMap.set(t.adminId, existing);
  });

  const cashierPerformance = Array.from(cashierMap.entries()).map(([adminId, val]) => ({
    adminId,
    adminName: val.adminName,
    transactionCount: val.count,
    revenue: val.revenue,
    averageTransaction: val.count > 0 ? Math.round(val.revenue / val.count) : 0
  }));

  // Business Insights Generation
  const businessInsights: string[] = [];
  if (revenueChangePercent > 0) {
    businessInsights.push(`Omzet hari ini meningkat ${revenueChangePercent}% dibandingkan dengan kemarin.`);
  } else if (revenueChangePercent < 0) {
    businessInsights.push(`Omzet hari ini mengalami penurunan ${Math.abs(revenueChangePercent)}% dibanding kemarin.`);
  }

  if (topProducts.length > 0) {
    businessInsights.push(`'${topProducts[0].productName}' menjadi produk terlaris dengan total ${topProducts[0].qtySold} item terjual.`);
  }

  const topCategory = salesByCategory.sort((a, b) => b.revenue - a.revenue)[0];
  if (topCategory) {
    businessInsights.push(`Kategori '${topCategory.category}' menyumbangkan kontribusi pendapatan terbesar bagi cafe.`);
  }

  const peakHour = salesByHour.sort((a, b) => b.transactions - a.transactions)[0];
  if (peakHour && peakHour.transactions > 0) {
    businessInsights.push(`Jam tersibuk transaksi terjadi pada pukul ${peakHour.hour} dengan ${peakHour.transactions} transaksi.`);
  }

  res.json({
    success: true,
    analytics: {
      todayRevenue,
      todayTransactions,
      todayItemsSold,
      averageOrderValue,
      revenueChangePercent,
      topProducts,
      salesByCategory,
      salesByHour,
      paymentDistribution,
      cashierPerformance,
      businessInsights
    }
  });
});

// Stock Adjustment API
app.post('/api/inventory/adjust', (req, res) => {
  const { productId, type, quantity, reason, adminName } = req.body;

  const product = dbData.products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
  }

  const previousStock = product.stock;
  let newStock = previousStock;

  if (type === 'STOCK_IN') {
    newStock = previousStock + Number(quantity);
  } else if (type === 'STOCK_OUT') {
    newStock = Math.max(0, previousStock - Number(quantity));
  } else if (type === 'ADJUSTMENT') {
    newStock = Number(quantity);
  }

  product.stock = newStock;
  product.updatedAt = new Date().toISOString();

  const movement: InventoryMovement = {
    id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    productId: product.id,
    productName: product.name,
    type,
    quantity: Number(quantity),
    previousStock,
    newStock,
    reason: reason || 'Penyesuaian stok manual',
    adminName: adminName || 'Admin',
    timestamp: new Date().toISOString()
  };

  dbData.inventoryMovements.push(movement);
  saveDB(dbData);

  res.json({ success: true, product, movement });
});

// Get Inventory Movements
app.get('/api/inventory/movements', (req, res) => {
  res.json({ success: true, movements: dbData.inventoryMovements.reverse() });
});


// Vite Middleware integration for production/development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Ngopay POS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
