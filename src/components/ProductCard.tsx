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
      className="bg-white rounded p-3 flex flex-col group cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
      id={`product-${product.id}`}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50 rounded-sm mb-3 flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {product.discount && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            {product.discount}% OFF
          </div>
        )}
      </div>

      <div className="flex flex-col flex-grow">
        <h3 className="text-black text-xs font-bold leading-tight line-clamp-2 h-8 mb-2">
          {product.name}
        </h3>
        
        <div className="mt-auto">
          {product.originalPrice && (
            <span className="text-gray-400 text-[10px] line-through block mb-1">
              DE: R$ {product.originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          )}
          <div className="flex flex-col mb-1">
            {product.originalPrice && <span className="text-brand-yellow font-bold text-[10px] uppercase">Por:</span>}
            <div className="text-black text-lg font-black leading-none">
              R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <p className="text-green-700 text-[10px] font-bold mb-3 uppercase">
            12x de R$ {(product.price / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={() => onAddToCart(product)}
              className="flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded text-[10px] font-bold uppercase transition-colors"
              id={`add-to-cart-${product.id}`}
            >
              <ShoppingCart size={12} />
              Carrinho
            </button>
            <button
              onClick={() => onAddToCart(product)} // Same action for now but styled differently
              className="flex items-center justify-center gap-1 bg-brand-yellow hover:bg-brand-gold text-black py-2 rounded text-[10px] font-bold uppercase transition-colors"
              id={`whatsapp-buy-${product.id}`}
            >
              Oferta
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
