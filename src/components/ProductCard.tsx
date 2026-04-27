/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import { Product } from '../types';
import { STORE_INFO } from '../constants';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  key?: string | number;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const whatsappMessage = encodeURIComponent(`Olá! Vi o produto ${product.name} no site e gostaria de mais informações.`);
  const whatsappUrl = `https://wa.me/${STORE_INFO.whatsapp.replace(/\D/g, '')}?text=${whatsappMessage}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-xl p-2.5 md:p-4 flex flex-col group cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 relative overflow-hidden"
      id={`product-${product.id}`}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50 rounded-lg mb-3 flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {product.discount && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded shadow-lg uppercase tracking-wider">
            {product.discount}% OFF
          </div>
        )}
      </div>

      <div className="flex flex-col flex-grow px-1">
        <h3 className="text-black text-[10px] md:text-xs font-bold leading-tight line-clamp-2 h-7 md:h-8 mb-2 group-hover:text-brand-yellow transition-colors">
          {product.name}
        </h3>
        
        <div className="mt-auto">
          {product.originalPrice && (
            <span className="text-gray-400 text-[8px] md:text-[10px] line-through block mb-0.5">
              R$ {product.originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          )}
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-black text-sm md:text-lg font-black leading-none">
              R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-green-600 text-[8px] md:text-[10px] font-black mb-3 uppercase tracking-tighter">
            12x R$ {(product.price / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>

          <div className="grid grid-cols-1 gap-1.5 mt-2">
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
              className="flex items-center justify-center gap-2 bg-black text-white py-2 md:py-2.5 rounded text-[9px] md:text-[11px] font-black uppercase transition-all hover:bg-zinc-800 active:scale-95 shadow-lg shadow-black/5"
              id={`add-to-cart-${product.id}`}
            >
              <ShoppingCart size={13} className="md:size-14" />
              <span className="hidden xs:inline">Comprar</span>
              <span className="xs:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
