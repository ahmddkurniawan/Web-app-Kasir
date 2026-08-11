import React, { useState, useEffect } from 'react';
import { productService } from '../../services/api';
import { Product, ProductCategory } from '../../types';
import { formatRupiah } from '../../utils/device';
import { Plus, Search, Edit3, Trash2, Coffee, Check, X, AlertTriangle } from 'lucide-react';

export const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  useEffect(() => {
    loadProducts();
    const handleRealtimeUpdate = () => loadProducts();
    window.addEventListener('realtime-update', handleRealtimeUpdate);
    return () => window.removeEventListener('realtime-update', handleRealtimeUpdate);
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const list = await productService.getAllProductsAdmin();
    setProducts(list);
    setLoading(false);
  };

  const categories: ProductCategory[] = [
    'Coffee',
    'Non Coffee',
    'Tea',
    'Food',
    'Snack',
    'Dessert',
    'Other',
  ];

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingProduct({
      id: `prod-${Date.now()}`,
      sku: `CF-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      category: 'Coffee',
      price: 20000,
      cost: 7000,
      stock: 30,
      minStock: 5,
      unit: 'cup',
      imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&auto=format&fit=crop&q=80',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct({ ...p });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.sku) return;

    await productService.saveProduct(editingProduct);
    await loadProducts();
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleToggleStatus = async (p: Product) => {
    const newStatus = p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await productService.saveProduct({ ...p, status: newStatus });
    await loadProducts();
  };

  const handleDeleteProduct = async (p: Product) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus produk "${p.name}"?`)) {
      await productService.deleteProduct(p.id);
      await loadProducts();
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-stone-950 text-stone-100 min-h-[calc(100vh-4rem)]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-stone-900 border border-stone-800">
        <div>
          <h1 className="text-2xl font-black text-stone-100 flex items-center gap-2">
            <Coffee className="w-6 h-6 text-amber-500" />
            Kelola Katalog Produk Cafe
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Tambah, edit harga, HPP/modal, stok awal, dan status produk
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-950/50 flex items-center space-x-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Categories Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-amber-600 text-white'
                : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            Semua
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === c
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari produk..."
            className="w-full pl-9 pr-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Product Table */}
      <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-stone-500">Memuat katalog...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950 text-stone-400 font-bold uppercase tracking-wider text-[10px] border-b border-stone-800">
                <tr>
                  <th className="py-3 px-3">Produk</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3 text-right">Harga Jual</th>
                  <th className="py-3 px-3 text-right">HPP (Modal)</th>
                  <th className="py-3 px-3 text-center">Stok</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-800/40">
                    <td className="py-2.5 px-3 font-sans font-bold text-stone-100 flex items-center space-x-2.5">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-8 h-8 rounded-lg object-cover bg-stone-950 border border-stone-800"
                      />
                      <span>{p.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-stone-400">{p.sku}</td>
                    <td className="py-2.5 px-3 font-sans text-stone-300">{p.category}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-500">
                      {formatRupiah(p.price)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-stone-400">
                      {formatRupiah(p.cost)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-stone-200">
                      {p.stock <= p.minStock ? (
                        <span className="text-amber-400 flex items-center justify-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{p.stock}</span>
                        </span>
                      ) : (
                        p.stock
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleToggleStatus(p)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {p.status}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
                          title="Edit Produk"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p)}
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-600 hover:text-white text-stone-200 transition-colors"
                          title="Hapus Produk"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl text-stone-100 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-bold text-base text-stone-100">
                {editingProduct.id ? 'Edit Menu Produk' : 'Tambah Menu Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-semibold mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl font-mono text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-semibold mb-1">Kategori</label>
                  <select
                    value={editingProduct.category || 'Coffee'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as ProductCategory })}
                    className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-400 font-semibold mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Kopi Gula Aren Special"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-semibold mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-semibold mb-1">HPP / Modal (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.cost || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-400 font-semibold mb-1">Stok Awal</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-semibold mb-1">Stok Min Alert</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.minStock || 5}
                    onChange={(e) => setEditingProduct({ ...editingProduct, minStock: parseInt(e.target.value) || 5 })}
                    className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-semibold mb-1">Satuan</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.unit || 'cup'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none focus:border-amber-500"
                    placeholder="cup / pcs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 font-semibold mb-1">URL Gambar Produk</label>
                <input
                  type="text"
                  value={editingProduct.imageUrl || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                  className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-500"
                  placeholder="https://images.unsplash.com/..."
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
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Produk</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
