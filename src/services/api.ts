import { Product, Transaction, DeviceInfo, OwnerAnalytics, InventoryMovement } from '../types';
import { db } from '../db/indexedDB';
import { supabase } from './supabase';

export const productService = {
  async getProducts(): Promise<Product[]> {
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase.from('products').select('*').order('name');
        if (!error && data) {
          const products = data.map(mapProduct);
          await db.products.clear();
          await db.products.bulkPut(products);
          return products;
        }
      } catch (err) {
        console.warn('Network request failed, falling back to IndexedDB products:', err);
      }
    }
    return await db.products.where('status').equals('ACTIVE').toArray();
  },

  async getAllProductsAdmin(): Promise<Product[]> {
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (!error && data) {
          const products = data.map(mapProduct);
          await db.products.bulkPut(products);
          return products;
        }
      } catch (err) {
        console.warn('Network error fetching admin products:', err);
      }
    }
    return await db.products.toArray();
  },

  async saveProduct(product: Partial<Product>): Promise<Product> {
    const fullProduct: Product = {
      id: product.id || `prod-${Date.now()}`,
      sku: product.sku || 'SKU-NEW',
      name: product.name || 'Produk Baru',
      category: product.category || 'Coffee',
      price: product.price || 0,
      cost: product.cost || 0,
      stock: product.stock || 0,
      minStock: product.minStock || 5,
      unit: product.unit || 'pcs',
      imageUrl: product.imageUrl || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&auto=format&fit=crop&q=80',
      status: product.status || 'ACTIVE',
      createdAt: product.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.products.put(fullProduct);

    if (navigator.onLine) {
      try {
        const row = {
          id: fullProduct.id,
          sku: fullProduct.sku,
          name: fullProduct.name,
          category: fullProduct.category,
          price: fullProduct.price,
          cost: fullProduct.cost,
          stock: fullProduct.stock,
          min_stock: fullProduct.minStock,
          unit: fullProduct.unit,
          image_url: fullProduct.imageUrl,
          status: fullProduct.status,
          created_at: fullProduct.createdAt,
          updated_at: fullProduct.updatedAt,
        };
        await supabase.from('products').upsert(row, { onConflict: 'id' });
      } catch (err) {
        console.warn('Failed to sync new product to server immediately:', err);
      }
    }

    return fullProduct;
  },

  async getInventoryMovements(): Promise<InventoryMovement[]> {
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase.from('inventory_movements').select('*').order('timestamp', { ascending: false });
        if (!error && data) {
          return data.map((m: any) => ({
            id: m.id,
            productId: m.product_id,
            productName: m.product_name,
            type: m.type,
            quantity: m.quantity,
            previousStock: m.previous_stock,
            newStock: m.new_stock,
            reason: m.reason,
            adminName: m.admin_name,
            timestamp: m.timestamp,
          }));
        }
      } catch (err) {
        console.warn('Network error fetching movements:', err);
      }
    }
    return [];
  },

  async adjustStock(params: { productId: string; productName: string; type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT'; quantity: number; notes: string }) {
    const prod = await db.products.get(params.productId);
    if (prod) {
      let newStock = prod.stock;
      if (params.type === 'STOCK_IN') newStock += params.quantity;
      else if (params.type === 'STOCK_OUT') newStock = Math.max(0, prod.stock - params.quantity);
      else if (params.type === 'ADJUSTMENT') newStock = params.quantity;

      await db.products.update(params.productId, { stock: newStock, updatedAt: new Date().toISOString() });

      if (navigator.onLine) {
        try {
          // Update stock on Supabase
          await supabase.from('products').update({ stock: newStock, updated_at: new Date().toISOString() }).eq('id', params.productId);
          
          // Insert movement
          await supabase.from('inventory_movements').insert({
            id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            product_id: params.productId,
            product_name: params.productName,
            type: params.type,
            quantity: params.quantity,
            previous_stock: prod.stock,
            new_stock: newStock,
            reason: params.notes || 'Penyesuaian stok manual',
            admin_name: 'Admin Kasir', // In a real app, get this from auth context
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          console.warn('Network error adjusting stock:', err);
        }
      }
    }
  }
};

export const transactionService = {
  async saveLocalTransaction(transaction: Transaction): Promise<Transaction> {
    await db.transactions.put(transaction);
    for (const item of transaction.items) {
      const prod = await db.products.get(item.productId);
      if (prod) {
        const newStock = Math.max(0, prod.stock - item.quantity);
        await db.products.update(prod.id, { stock: newStock, updatedAt: new Date().toISOString() });
      }
    }
    return transaction;
  },

  async getLocalTransactions(): Promise<Transaction[]> {
    const all = await db.transactions.reverse().sortBy('transactionDate');
    return all.filter(t => !t.isDeleted);
  },

  async getPendingTransactions(): Promise<Transaction[]> {
    return await db.transactions.where('syncStatus').equals('pending').or('syncStatus').equals('failed').toArray();
  },

  async deleteTransaction(localId: string): Promise<boolean> {
    const trx = await db.transactions.get(localId);
    if (!trx) return false;

    // Restore stock
    if (Array.isArray(trx.items)) {
      for (const item of trx.items) {
        const prod = await db.products.get(item.productId);
        if (prod) {
          const newStock = prod.stock + item.quantity;
          await db.products.update(prod.id, { stock: newStock, updatedAt: new Date().toISOString() });
        }
      }
    }

    // Mark as deleted for sync service to handle
    await db.transactions.update(localId, { isDeleted: true, syncStatus: 'pending' });
    return true;
  }
};

export const ownerService = {
  async getAnalytics(): Promise<OwnerAnalytics | null> {
    if (!navigator.onLine) return null;
    try {
      const { data: transactions, error } = await supabase.from('transactions').select('*');
      if (error) return null;

      const trxList = (transactions || []).map(mapTransaction);
      const todayStr = new Date().toISOString().slice(0, 10);
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

      const todayTrxs = trxList.filter(t => t.transactionDate.startsWith(todayStr));
      const yesterdayTrxs = trxList.filter(t => t.transactionDate.startsWith(yesterdayStr));

      const todayRevenue = todayTrxs.reduce((s, t) => s + t.total, 0);
      const yesterdayRevenue = yesterdayTrxs.reduce((s, t) => s + t.total, 0);
      const revenueChangePercent = yesterdayRevenue > 0
        ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
        : todayRevenue > 0 ? 100 : 0;

      const todayItemsSold = todayTrxs.reduce((s, t) => s + t.items.reduce((is, i) => is + i.quantity, 0), 0);
      const todayTransactions = todayTrxs.length;
      const averageOrderValue = todayTransactions > 0 ? Math.round(todayRevenue / todayTransactions) : 0;

      // Top products
      const productSalesMap = new Map<string, { productName: string; category: any; qtySold: number; revenue: number }>();
      trxList.forEach(t => t.items.forEach(item => {
        const ex = productSalesMap.get(item.productId) || { productName: item.productName, category: item.category, qtySold: 0, revenue: 0 };
        ex.qtySold += item.quantity;
        ex.revenue += item.subtotal;
        productSalesMap.set(item.productId, ex);
      }));
      const totalAllRevenue = Array.from(productSalesMap.values()).reduce((s, p) => s + p.revenue, 0) || 1;
      const topProducts = Array.from(productSalesMap.entries())
        .map(([productId, val]) => ({ productId, ...val, percentageContribution: Math.round((val.revenue / totalAllRevenue) * 100) }))
        .sort((a, b) => b.qtySold - a.qtySold).slice(0, 10);

      // Sales by category
      const categoryMap = new Map<string, { revenue: number; qtySold: number }>();
      trxList.forEach(t => t.items.forEach(item => {
        const ex = categoryMap.get(item.category) || { revenue: 0, qtySold: 0 };
        ex.revenue += item.subtotal; ex.qtySold += item.quantity;
        categoryMap.set(item.category, ex);
      }));
      const salesByCategory = Array.from(categoryMap.entries()).map(([category, val]) => ({ category, ...val }));

      // Sales by hour
      const hourlyMap = new Map<string, { revenue: number; transactions: number }>();
      for (let h = 8; h <= 22; h++) hourlyMap.set(`${h.toString().padStart(2, '0')}:00`, { revenue: 0, transactions: 0 });
      trxList.forEach(t => {
        const label = `${new Date(t.transactionDate).getHours().toString().padStart(2, '0')}:00`;
        if (hourlyMap.has(label)) {
          const e = hourlyMap.get(label)!;
          e.revenue += t.total; e.transactions += 1;
        }
      });
      const salesByHour = Array.from(hourlyMap.entries()).map(([hour, val]) => ({ hour, ...val }));

      // Payment distribution
      const paymentMap = new Map<string, { count: number; amount: number }>();
      trxList.forEach(t => {
        const ex = paymentMap.get(t.paymentMethod) || { count: 0, amount: 0 };
        ex.count += 1; ex.amount += t.total;
        paymentMap.set(t.paymentMethod, ex);
      });
      const paymentDistribution = Array.from(paymentMap.entries()).map(([method, val]) => ({ method, ...val }));

      // Cashier performance
      const cashierMap = new Map<string, { adminName: string; count: number; revenue: number }>();
      trxList.forEach(t => {
        const ex = cashierMap.get(t.adminId) || { adminName: t.adminName || 'Admin', count: 0, revenue: 0 };
        ex.count += 1; ex.revenue += t.total;
        cashierMap.set(t.adminId, ex);
      });
      const cashierPerformance = Array.from(cashierMap.entries()).map(([adminId, val]) => ({
        adminId, adminName: val.adminName, transactionCount: val.count, revenue: val.revenue,
        averageTransaction: val.count > 0 ? Math.round(val.revenue / val.count) : 0
      }));

      const businessInsights: string[] = [];
      if (revenueChangePercent > 0) businessInsights.push(`Omzet hari ini meningkat ${revenueChangePercent}% dibandingkan kemarin.`);
      else if (revenueChangePercent < 0) businessInsights.push(`Omzet hari ini turun ${Math.abs(revenueChangePercent)}% dibanding kemarin.`);
      if (topProducts[0]) businessInsights.push(`'${topProducts[0].productName}' menjadi produk terlaris dengan ${topProducts[0].qtySold} item terjual.`);

      return {
        todayRevenue, todayTransactions, todayItemsSold, averageOrderValue, revenueChangePercent,
        topProducts, salesByCategory, salesByHour, paymentDistribution, cashierPerformance, businessInsights
      };
    } catch {
      return null;
    }
  },

  async getDevices(): Promise<DeviceInfo[]> {
    if (!navigator.onLine) return [];
    try {
      const { data, error } = await supabase.from('devices').select('*').order('last_active', { ascending: false });
      if (error) return [];
      
      const now = Date.now();
      return (data || []).map((d: any) => ({
        deviceId: d.device_id,
        deviceName: d.device_name,
        lastActive: d.last_active,
        status: (now - new Date(d.last_active).getTime() < 2 * 60 * 1000 ? 'ONLINE' : 'OFFLINE') as 'ONLINE' | 'OFFLINE',
        pendingSyncCount: d.pending_sync_count,
        ipAddress: d.ip_address,
      }));
    } catch {
      return [];
    }
  }
};

// Helpers to map Supabase snake_case to TS camelCase
export function mapProduct(row: any): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    price: row.price,
    cost: row.cost,
    stock: row.stock,
    minStock: row.min_stock,
    unit: row.unit,
    imageUrl: row.image_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTransaction(row: any): Transaction {
  return {
    localId: row.local_id,
    serverId: row.server_id,
    transactionNumber: row.transaction_number,
    deviceId: row.device_id,
    deviceName: row.device_name,
    adminId: row.admin_id,
    adminName: row.admin_name,
    transactionDate: row.transaction_date,
    items: row.items,
    subtotal: row.subtotal,
    discount: row.discount,
    discountPercentage: row.discount_percentage,
    total: row.total,
    paymentMethod: row.payment_method,
    cashAmount: row.cash_amount,
    changeAmount: row.change_amount,
    syncStatus: row.sync_status,
    createdAt: row.created_at,
    syncedAt: row.synced_at,
    syncError: row.sync_error,
  };
}
