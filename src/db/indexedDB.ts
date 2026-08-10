import Dexie, { Table } from 'dexie';
import { Product, Transaction, InventoryMovement, StoreSettings } from '../types';

export class NgopayDatabase extends Dexie {
  products!: Table<Product, string>;
  transactions!: Table<Transaction, string>;
  inventoryMovements!: Table<InventoryMovement, string>;
  settings!: Table<StoreSettings & { id: string }, string>;

  constructor() {
    super('NgopayPOSDatabase');
    
    // Schema definition for IndexedDB tables
    this.version(1).stores({
      products: 'id, sku, name, category, status, stock',
      transactions: 'localId, transactionNumber, syncStatus, transactionDate, deviceId, adminId',
      inventoryMovements: 'id, productId, type, timestamp',
      settings: 'id'
    });
  }
}

export const db = new NgopayDatabase();

// Default initial settings for receipt and store configuration
export const defaultSettings: StoreSettings = {
  storeName: 'NGOPAY COFFEE',
  tagline: 'Kopi Nikmat, Harga Sahabat',
  address: 'Jl. Pemuda No. 88, Jakarta Selatan',
  phone: '+62 812-3456-7890',
  receiptFooter: 'Terima kasih telah berkunjung ke Cafe Ngopay!\nFollow IG @cafengopay.id',
  taxRatePercent: 0,
  enableThermalPrinter: true,
  thermalPaperWidth: '58mm',
};

export async function initLocalStore() {
  try {
    const existingSettings = await db.settings.get('default');
    if (!existingSettings) {
      await db.settings.put({ id: 'default', ...defaultSettings });
    }
  } catch (error) {
    console.error('Failed to initialize local IndexedDB settings:', error);
  }
}
