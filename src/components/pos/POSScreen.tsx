import React, { useState, useEffect } from 'react';
import { Product, ProductCategory, CartItem, PaymentMethod, Transaction } from '../../types';
import { productService, transactionService } from '../../services/api';
import { ProductCard } from './ProductCard';
import { CartDrawer } from './CartDrawer';
import { PaymentModal } from './PaymentModal';
import { DiscountModal } from './DiscountModal';
import { ReceiptModal } from './ReceiptModal';
import { useAuth } from '../../context/AuthContext';
import { generateTransactionNumber, getDeviceId, getDeviceName } from '../../utils/device';
import { Search, ShoppingBag, Coffee, Layers } from 'lucide-react';

export const POSScreen: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>('ALL');
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Modals state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  useEffect(() => {
    loadCatalog();
    
    // Listen for real-time updates from Supabase
    const handleRealtimeUpdate = () => {
      loadCatalog();
    };
    
    // Listen for edit-transaction event
    const handleEditTransaction = (e: Event) => {
      const customEvent = e as CustomEvent<Transaction>;
      const trx = customEvent.detail;
      
      const newCart: CartItem[] = trx.items.map(item => {
        const prod = products.find(p => p.id === item.productId);
        return {
          product: prod || { 
            id: item.productId, 
            name: item.productName, 
            price: item.price, 
            category: item.category, 
            stock: 999 
          } as Product,
          quantity: item.quantity,
          subtotal: item.subtotal
        };
      });
      
      setCart(newCart);
      setDiscountAmount(trx.discount || 0);
      window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'pos' }));
    };

    window.addEventListener('realtime-update', handleRealtimeUpdate);
    window.addEventListener('edit-transaction', handleEditTransaction);
    
    return () => {
      window.removeEventListener('realtime-update', handleRealtimeUpdate);
      window.removeEventListener('edit-transaction', handleEditTransaction);
    };
  }, [products]); // Re-bind when products change so the edit handler has the latest catalog

  const loadCatalog = async () => {
    setLoading(true);
    const list = await productService.getProducts();
    setProducts(list);
    setLoading(false);
  };

  const categories: Array<ProductCategory | 'ALL'> = [
    'ALL',
    'Coffee',
    'Non Coffee',
    'Tea',
    'Food',
    'Snack',
    'Dessert',
    'Other'
  ];

  // Filter products by search query and category
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  // Cart Handlers
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const currentQty = updated[existingIdx].quantity;
        if (currentQty >= product.stock) {
          alert(`Stok ${product.name} hanya tersisa ${product.stock}`);
          return prev;
        }
        const newQty = currentQty + 1;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          subtotal: newQty * product.price,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            subtotal: product.price,
          },
        ];
      }
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) {
              alert(`Stok terbatas ${item.product.stock}`);
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.product.price,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountAmount(0);
  };

  // Payment Confirmation
  const handleConfirmPayment = async (
    paymentMethod: PaymentMethod,
    cashAmount?: number,
    changeAmount?: number
  ) => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const total = Math.max(0, subtotal - discountAmount);
    const localId = `loc-trx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const transactionNumber = generateTransactionNumber();

    const transaction: Transaction = {
      localId,
      transactionNumber,
      deviceId: getDeviceId(),
      deviceName: getDeviceName(),
      adminId: user?.id || 'admin-1',
      adminName: user?.name || 'Kasir',
      transactionDate: new Date().toISOString(),
      items: cart.map((i, idx) => ({
        id: `item-${idx}-${Date.now()}`,
        productId: i.product.id,
        productName: i.product.name,
        sku: i.product.sku,
        category: i.product.category,
        price: i.product.price,
        cost: i.product.cost,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
      subtotal,
      discount: discountAmount,
      total,
      paymentMethod,
      cashAmount,
      changeAmount,
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Save locally to IndexedDB immediately
    await transactionService.saveLocalTransaction(transaction);

    // Refresh local products stock in catalog
    await loadCatalog();

    // Close payment modal, clear cart, open receipt
    setIsPaymentOpen(false);
    setCart([]);
    setDiscountAmount(0);
    setCompletedTransaction(transaction);
    setIsReceiptOpen(true);
    setIsMobileCartOpen(false);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = Math.max(0, cart.reduce((sum, item) => sum + item.subtotal, 0) - discountAmount);

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-stone-950 text-stone-100">
      
      {/* Left Main Catalog Area */}
      <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto">
        
        {/* Search & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-100 tracking-tight flex items-center gap-2">
              <Coffee className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500" />
              Kasir POS Cafe Ngopay
            </h1>
            <p className="text-[11px] sm:text-xs text-stone-400 mt-1">Pilih menu, atur pesanan, dan selesaikan transaksi kasir</p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-500 pointer-events-none" />
            <input
              id="search-product-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari menu, SKU, kategori..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
            />
          </div>
        </div>

        {/* Horizontal Category Scroll Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800/80'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{cat === 'ALL' ? 'Semua Menu' : cat}</span>
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 animate-pulse pb-28 lg:pb-0">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-56 bg-stone-900 rounded-2xl border border-stone-800/60" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-stone-900/40 rounded-2xl border border-stone-800/60 p-6 space-y-2 pb-28 lg:pb-0">
            <Coffee className="w-10 h-10 text-stone-600 mx-auto" />
            <h3 className="text-sm font-bold text-stone-300">Tidak ada produk ditemukan</h3>
            <p className="text-xs text-stone-500">
              Coba ubah kata kunci pencarian atau pilih kategori lain.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 pb-28 lg:pb-0">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}

      </div>

      {/* Floating Cart Button for Mobile */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 lg:hidden">
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full py-3.5 px-5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-2xl shadow-xl flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-amber-950/60 rounded-full flex items-center justify-center text-xs font-black">
                {totalCartCount}
              </div>
              <span className="text-sm">Lihat Keranjang</span>
            </div>
            <div className="text-sm font-black">
              Rp {totalCartPrice.toLocaleString('id-ID')}
            </div>
          </button>
        </div>
      )}

      {/* Desktop Cart & Mobile Bottom Sheet Drawer */}
      <CartDrawer
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        discountAmount={discountAmount}
        onOpenDiscountModal={() => setIsDiscountOpen(true)}
        onOpenPaymentModal={() => setIsPaymentOpen(true)}
        isOpenMobile={isMobileCartOpen}
        onCloseMobile={() => setIsMobileCartOpen(false)}
      />

      {/* Discount Modal */}
      <DiscountModal
        isOpen={isDiscountOpen}
        onClose={() => setIsDiscountOpen(false)}
        subtotal={cart.reduce((sum, item) => sum + item.subtotal, 0)}
        currentDiscount={discountAmount}
        onApplyDiscount={(amount) => setDiscountAmount(amount)}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        subtotal={cart.reduce((sum, item) => sum + item.subtotal, 0)}
        discount={discountAmount}
        total={totalCartPrice}
        cart={cart}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={completedTransaction}
      />

    </div>
  );
};
