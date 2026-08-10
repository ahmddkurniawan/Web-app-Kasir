import React from 'react';
import { CartItem } from '../../types';
import { formatRupiah } from '../../utils/device';
import { Plus, Minus, Trash2, Tag, ShoppingBag, ArrowRight } from 'lucide-react';

interface CartDrawerProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  discountAmount: number;
  onOpenDiscountModal: () => void;
  onOpenPaymentModal: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  discountAmount,
  onOpenDiscountModal,
  onOpenPaymentModal,
  isOpenMobile,
  onCloseMobile,
}) => {
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const total = Math.max(0, subtotal - discountAmount);

  const cartContent = (
    <div className="flex flex-col h-full bg-stone-900 border-l border-stone-800 text-stone-200">
      
      {/* Cart Header */}
      <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-500 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-stone-100">Pesanan Aktif</h2>
            <span className="text-[11px] text-stone-400">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} Item dalam Keranjang
            </span>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Kosongkan</span>
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-stone-800/60">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 text-stone-500">
            <ShoppingBag className="w-12 h-12 stroke-[1.2] text-stone-600 mb-3" />
            <p className="text-sm font-semibold text-stone-400">Keranjang Masih Kosong</p>
            <p className="text-xs text-stone-500 mt-1 max-w-[200px]">
              Klik pada produk di sebelah kiri untuk menambahkan item.
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.product.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-xs text-stone-200 truncate">
                  {item.product.name}
                </h4>
                <div className="text-[11px] text-amber-500 font-bold mt-0.5">
                  {formatRupiah(item.product.price)}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center space-x-2 bg-stone-950 p-1 rounded-xl border border-stone-800">
                <button
                  onClick={() => onUpdateQuantity(item.product.id, -1)}
                  className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors"
                  aria-label="Kurangi"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-xs font-bold text-stone-100">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.product.id, 1)}
                  className="w-6 h-6 rounded-lg bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center transition-colors"
                  aria-label="Tambah"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Item Subtotal & Delete */}
              <div className="text-right min-w-[70px]">
                <div className="text-xs font-extrabold text-stone-100">
                  {formatRupiah(item.subtotal)}
                </div>
                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="text-stone-500 hover:text-rose-400 text-[10px] mt-0.5"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Checkout Footer */}
      <div className="p-4 border-t border-stone-800 bg-stone-950/80 space-y-3">
        {/* Discount Button */}
        <button
          onClick={onOpenDiscountModal}
          disabled={cart.length === 0}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-xs text-stone-300 transition-colors disabled:opacity-50"
        >
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-amber-500" />
            <span>Diskon Transaksi</span>
          </div>
          <span className="font-bold text-amber-400">
            {discountAmount > 0 ? `- ${formatRupiah(discountAmount)}` : 'Tambah Diskon'}
          </span>
        </button>

        {/* Price Calculations */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-stone-400">
            <span>Subtotal</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-amber-400 font-semibold">
              <span>Diskon</span>
              <span>- {formatRupiah(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-base font-black text-stone-100 pt-2 border-t border-stone-800">
            <span>TOTAL</span>
            <span className="text-amber-500">{formatRupiah(total)}</span>
          </div>
        </div>

        {/* Pay Button */}
        <button
          id="btn-checkout-pay"
          onClick={onOpenPaymentModal}
          disabled={cart.length === 0}
          className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-white font-extrabold rounded-xl shadow-lg shadow-amber-950/60 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide"
        >
          <span>PROSES PEMBAYARAN</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Cart Side-Panel */}
      <div className="hidden lg:block w-80 xl:w-96 h-[calc(100vh-4rem)] sticky top-16">
        {cartContent}
      </div>

      {/* Mobile Drawer / Bottom Sheet */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-stone-950/80 backdrop-blur-sm">
          <div
            onClick={onCloseMobile}
            className="flex-1"
          />
          <div className="h-[85vh] w-full rounded-t-2xl overflow-hidden shadow-2xl animate-slide-up">
            {cartContent}
          </div>
        </div>
      )}
    </>
  );
};
