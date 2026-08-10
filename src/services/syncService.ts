import { db } from '../db/indexedDB';
import { getDeviceId, getDeviceName } from '../utils/device';
import { Transaction } from '../types';
import { supabase } from './supabase';

export type SyncState = 'ONLINE' | 'OFFLINE' | 'SYNCING';

type SyncListener = (state: SyncState, pendingCount: number) => void;

class SyncManager {
  private currentState: SyncState = navigator.onLine ? 'ONLINE' : 'OFFLINE';
  private listeners: Set<SyncListener> = new Set();
  private isSyncingInProgress = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnlineChange(true));
      window.addEventListener('offline', () => this.handleOnlineChange(false));
      
      setInterval(() => {
        if (navigator.onLine) {
          this.triggerSync();
          this.sendHeartbeat();
        }
      }, 20000);
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.notify();
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.getPendingCount().then((count) => {
      this.listeners.forEach(fn => fn(this.currentState, count));
    });
  }

  public async getPendingCount(): Promise<number> {
    try {
      return await db.transactions
        .where('syncStatus')
        .equals('pending')
        .or('syncStatus')
        .equals('failed')
        .count();
    } catch {
      return 0;
    }
  }

  private handleOnlineChange(isOnline: boolean) {
    this.currentState = isOnline ? 'ONLINE' : 'OFFLINE';
    this.notify();
    if (isOnline) {
      this.triggerSync();
      this.sendHeartbeat();
    }
  }

  public async triggerSync(): Promise<{ success: boolean; syncedCount: number; message?: string }> {
    if (!navigator.onLine) {
      this.currentState = 'OFFLINE';
      this.notify();
      return { success: false, syncedCount: 0, message: 'Perangkat sedang offline' };
    }

    if (this.isSyncingInProgress) {
      return { success: true, syncedCount: 0, message: 'Sinkronisasi sedang berjalan' };
    }

    this.isSyncingInProgress = true;
    this.currentState = 'SYNCING';
    this.notify();

    try {
      const pendingTransactions = await db.transactions
        .where('syncStatus')
        .equals('pending')
        .or('syncStatus')
        .equals('failed')
        .toArray();

      if (pendingTransactions.length === 0) {
        this.currentState = 'ONLINE';
        this.isSyncingInProgress = false;
        this.notify();
        return { success: true, syncedCount: 0, message: 'Semua transaksi sudah tersinkron' };
      }

      for (const trx of pendingTransactions) {
        await db.transactions.update(trx.localId, { syncStatus: 'syncing' });
      }

      const deviceId = getDeviceId();
      const deviceName = getDeviceName();

      let syncedCount = 0;

      for (const trx of pendingTransactions) {
        try {
          const serverId = `srv-trx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const row = {
            local_id: trx.localId,
            server_id: serverId,
            transaction_number: trx.transactionNumber,
            device_id: deviceId,
            device_name: deviceName,
            admin_id: trx.adminId,
            admin_name: trx.adminName,
            transaction_date: trx.transactionDate,
            items: trx.items,
            subtotal: trx.subtotal,
            discount: trx.discount,
            discount_percentage: trx.discountPercentage ?? null,
            total: trx.total,
            payment_method: trx.paymentMethod,
            cash_amount: trx.cashAmount ?? null,
            change_amount: trx.changeAmount ?? null,
            sync_status: 'synced',
            synced_at: new Date().toISOString(),
          };

          const { error } = await supabase.from('transactions').upsert(row, { onConflict: 'local_id' });
          
          if (error) throw new Error(error.message);

          // Update stock and movements directly to Supabase
          if (Array.isArray(trx.items)) {
            for (const item of trx.items) {
              const { data: prod } = await supabase.from('products').select('stock').eq('id', item.productId).single();
              if (prod) {
                const newStock = Math.max(0, prod.stock - item.quantity);
                await supabase.from('products').update({ stock: newStock, updated_at: new Date().toISOString() }).eq('id', item.productId);
                await supabase.from('inventory_movements').insert({
                  id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  product_id: item.productId,
                  product_name: item.productName,
                  type: 'SALE',
                  quantity: item.quantity,
                  previous_stock: prod.stock,
                  new_stock: newStock,
                  reason: `Penjualan kasir (${trx.transactionNumber})`,
                  admin_name: trx.adminName,
                  timestamp: new Date().toISOString(),
                });
              }
            }
          }

          await db.transactions.update(trx.localId, {
            syncStatus: 'synced',
            serverId,
            syncedAt: new Date().toISOString(),
            syncError: undefined
          });
          syncedCount++;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Unknown sync error';
          await db.transactions.update(trx.localId, {
            syncStatus: 'failed',
            syncError: msg
          });
        }
      }

      this.currentState = 'ONLINE';
      this.isSyncingInProgress = false;
      this.notify();

      return {
        success: true,
        syncedCount,
        message: `Berhasil menyinkronkan ${syncedCount} transaksi`
      };
    } catch (err: unknown) {
      console.error('Error during offline sync:', err);
      
      const pendingTransactions = await db.transactions
        .where('syncStatus')
        .equals('syncing')
        .toArray();

      for (const trx of pendingTransactions) {
        await db.transactions.update(trx.localId, { syncStatus: 'failed' });
      }

      this.currentState = 'ONLINE';
      this.isSyncingInProgress = false;
      this.notify();

      const errorMessage = err instanceof Error ? err.message : 'Koneksi ke server gagal';
      return { success: false, syncedCount: 0, message: errorMessage };
    }
  }

  public async sendHeartbeat() {
    if (!navigator.onLine) return;
    try {
      const pendingCount = await this.getPendingCount();
      await supabase.from('devices').upsert({
        device_id: getDeviceId(),
        device_name: getDeviceName() || 'Kasir',
        last_active: new Date().toISOString(),
        status: 'ONLINE',
        pending_sync_count: pendingCount,
      }, { onConflict: 'device_id' });
    } catch {
      // Ignore heartbeat silent failures
    }
  }

  public getStatus(): SyncState {
    return this.currentState;
  }
}

export const syncManager = new SyncManager();
