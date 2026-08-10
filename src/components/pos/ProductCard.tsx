import React from 'react';
import { Product } from '../../types';
import { formatRupiah } from '../../utils/device';
import { soundFx } from '../../utils/sound';
import { Plus, AlertTriangle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.minStock;

  const handleAdd = () => {
    if (isOutOfStock) return;
    soundFx.playBeep();
    onAddToCart(product);
  };

  return (
    <div
      onClick={handleAdd}
      className={`group bg-stone-900 border rounded-2xl p-3 flex flex-col justify-between transition-all duration-200 ${
        isOutOfStock
          ? 'border-stone-800/60 opacity-60 cursor-not-allowed'
          : 'border-stone-800 hover:border-amber-500/80 hover:shadow-lg hover:shadow-amber-950/30 cursor-pointer'
      }`}
    >
      <div>
        {/* Image Container with Badges */}
        <div className="relative w-full h-32 sm:h-36 rounded-xl overflow-hidden bg-stone-950 mb-3">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&auto=format&fit=crop&q=80';
            }}
          />

          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-900/90 text-amber-400 border border-stone-700/80 backdrop-blur-sm">
              {product.category}
            </span>
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-xs font-bold text-rose-400 bg-rose-950/90 px-3 py-1 rounded-full border border-rose-800">
                Habis
              </span>
            </div>
          )}

          {!isOutOfStock && isLowStock && (
            <div className="absolute bottom-2 left-2 flex items-center space-x-1 text-[10px] font-bold bg-amber-950/90 text-amber-300 border border-amber-700 px-2 py-0.5 rounded-full backdrop-blur-sm">
              <AlertTriangle className="w-3 h-3" />
              <span>Stok Menipis ({product.stock})</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-1">
          <div className="text-[11px] font-mono text-stone-500">{product.sku}</div>
          <h3 className="font-bold text-sm text-stone-100 line-clamp-2 leading-snug group-hover:text-amber-400 transition-colors">
            {product.name}
          </h3>
        </div>
      </div>

      {/* Price & Add Button */}
      <div className="mt-3 pt-2.5 border-t border-stone-800/80 flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold text-amber-500">
            {formatRupiah(product.price)}
          </span>
          <span className="text-[10px] text-stone-500 ml-1">/ {product.unit}</span>
        </div>

        <button
          type="button"
          disabled={isOutOfStock}
          onClick={(e) => {
            e.stopPropagation();
            handleAdd();
          }}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            isOutOfStock
              ? 'bg-stone-800 text-stone-600'
              : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-950/50 active:scale-95'
          }`}
          aria-label={`Tambah ${product.name}`}
        >
          <Plus className="w-4 h-4 font-bold" />
        </button>
      </div>
    </div>
  );
};
