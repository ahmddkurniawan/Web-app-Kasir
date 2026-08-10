import React, { useState, useEffect } from 'react';
import { productService } from '../../services/api';
import { Product, InventoryMovement } from '../../types';
import { Package, ArrowUpRight, ArrowDownLeft, AlertTriangle, Plus, RefreshCw, History } from 'lucide-react';

export const InventoryManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Stock Adjustment State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT'>('STOCK_IN');
  const [quantity, setQuantity] = useState(10);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [prods, moves] = await Promise.all([
      productService.getAllProductsAdmin(),
      productService.getInventoryMovements(),
    ]);
    setProducts(prods);
    setMovements(moves);
    setLoading(false);
  };

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  const handleOpenAdjustment = (product: Product, type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT') => {
    setSelectedProduct(product);
    setMovementType(type);
    setQuantity(10);
    setNotes(type === 'STOCK_IN' ? 'Restok bahan baku' : 'Penyesuaian stok atau afkir');
    setIsModalOpen(true);
  };

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    await productService.adjustStock({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      type: movementType,
      quantity,
      notes,
    });

    await loadData();
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-stone-950 text-stone-100 min-h-[calc(100vh-4rem)]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-stone-900 border border-stone-800">
        <div>
          <h1 className="text-2xl font-black text-stone-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" />
            Manajemen Stok & Bahan Baku (Inventory)
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Monitoring stok produk, penerimaan barang (Stock IN), pemakaian (Stock OUT), dan log histori
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 flex items-center space-x-2 transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-amber-500" />
          <span>Segarkan Stok</span>
        </button>
      </div>

      {/* Low Stock Warning Alert Banner */}
      {lowStockProducts.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-800/80 shadow-lg space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-500 animate-bounce" />
            <span>Peringatan Stok Menipis! ({lowStockProducts.length} Produk Perlu Restok)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="p-3 bg-stone-900 rounded-xl border border-amber-900/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-stone-200">{p.name}</div>
                  <div className="text-[10px] text-amber-400 font-semibold">
                    Stok: {p.stock} {p.unit} (Min: {p.minStock})
                  </div>
                </div>
                <button
                  onClick={() => handleOpenAdjustment(p, 'STOCK_IN')}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-[10px] flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Restok</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Stock List */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
          <h3 className="font-bold text-base text-stone-100">Daftar Stok Produk Saat Ini</h3>

          {loading ? (
            <div className="py-8 text-center text-xs text-stone-500">Memuat data stok...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-950 text-stone-400 font-bold uppercase tracking-wider text-[10px] border-b border-stone-800">
                  <tr>
                    <th className="py-3 px-3">Produk</th>
                    <th className="py-3 px-3 text-center">Stok Sisa</th>
                    <th className="py-3 px-3 text-center">Min. Stok</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Penyesuaian Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-mono">
                  {products.map((p) => {
                    const isLow = p.stock <= p.minStock;
                    return (
                      <tr key={p.id} className="hover:bg-stone-800/40">
                        <td className="py-2.5 px-3 font-sans font-bold text-stone-100">
                          {p.name}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-stone-100">
                          {p.stock} {p.unit}
                        </td>
                        <td className="py-2.5 px-3 text-center text-stone-500">
                          {p.minStock} {p.unit}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isLow ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 font-bold text-[10px]">
                              MENIPIS
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
                              AMAN
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleOpenAdjustment(p, 'STOCK_IN')}
                              className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 transition-colors"
                              title="Restok (Stock IN)"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenAdjustment(p, 'STOCK_OUT')}
                              className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-800 transition-colors"
                              title="Kurangi Stok (Stock OUT)"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Stock Movement Log */}
        <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-stone-100 flex items-center space-x-2">
              <History className="w-4 h-4 text-amber-500" />
              <span>Histori Mutasi Stok</span>
            </h3>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {movements.map((m) => (
              <div key={m.id} className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-200">{m.productName}</span>
                  {(m.type === 'STOCK_IN' || (m.type as string) === 'IN') && (
                    <span className="text-emerald-400 font-bold text-[11px]">+ {m.quantity} (IN)</span>
                  )}
                  {(m.type === 'STOCK_OUT' || (m.type as string) === 'OUT') && (
                    <span className="text-rose-400 font-bold text-[11px]">- {m.quantity} (OUT)</span>
                  )}
                  {m.type === 'ADJUSTMENT' && (
                    <span className="text-amber-400 font-bold text-[11px]">{m.quantity} (ADJ)</span>
                  )}
                </div>
                <div className="text-[10px] text-stone-500 font-mono flex items-center justify-between">
                  <span>{new Date(m.timestamp || (m as any).date).toLocaleString('id-ID')}</span>
                  <span className="italic">{m.reason || (m as any).notes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Stock Adjustment Modal */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md rounded-2xl p-6 shadow-2xl text-stone-100 space-y-4">
            
            <div className="pb-3 border-b border-stone-800">
              <h3 className="font-bold text-base text-stone-100">
                Penyesuaian Stok: <span className="text-amber-500">{selectedProduct.name}</span>
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Stok saat ini: <strong className="text-stone-100">{selectedProduct.stock} {selectedProduct.unit}</strong>
              </p>
            </div>

            <form onSubmit={handleSaveMovement} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-400 font-semibold mb-1">Jenis Mutasi</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType('STOCK_IN')}
                    className={`py-2 rounded-xl font-bold ${
                      movementType === 'STOCK_IN'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-950 border border-stone-800 text-stone-400'
                    }`}
                  >
                    Stock IN (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('STOCK_OUT')}
                    className={`py-2 rounded-xl font-bold ${
                      movementType === 'STOCK_OUT'
                        ? 'bg-rose-600 text-white'
                        : 'bg-stone-950 border border-stone-800 text-stone-400'
                    }`}
                  >
                    Stock OUT (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('ADJUSTMENT')}
                    className={`py-2 rounded-xl font-bold ${
                      movementType === 'ADJUSTMENT'
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-950 border border-stone-800 text-stone-400'
                    }`}
                  >
                    Adjustment
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-stone-400 font-semibold mb-1">
                  Jumlah Quantity ({selectedProduct.unit})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 font-bold text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-400 font-semibold mb-1">Keterangan / Catatan</label>
                <input
                  type="text"
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Pembelian bahan baku baru dari Supplier"
                />
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 text-stone-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold"
                >
                  Simpan Mutasi
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
