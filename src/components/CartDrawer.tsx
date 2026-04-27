/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Plus, Minus, MessageCircle, User, Phone, CheckCircle2, CreditCard, Mail } from 'lucide-react';
import { CartItem, Order } from '../types';
import { STORE_INFO } from '../constants';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useState } from 'react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onClearCart?: () => void;
  whatsappNumber?: string;
}

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQuantity, 
  onRemove, 
  onClearCart,
  whatsappNumber 
}: CartDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const getWhatsappFinalMessage = (name: string) => {
    let message = `Olá! Meu nome é *${name}*.\n\n`;
    message += `Gostaria de finalizar o seguinte pedido na *Eternos Móveis*:\n\n`;
    items.forEach(item => {
      message += `✅ *${item.name}* (${item.quantity}x)\n   R$ ${(item.price * item.quantity).toLocaleString('pt-BR')}\n`;
    });
    message += `\n💰 *Total: R$ ${total.toLocaleString('pt-BR')}*\n`;
    message += `\nVou aguardar o seu atendimento agora!`;
    return encodeURIComponent(message);
  };

  const handleMercadoPagoCheckout = async () => {
    if (!customerName || !customerPhone || !customerEmail) {
      alert("Por favor, preencha seu nome, telefone e E-MAIL antes de pagar.");
      return;
    }

    if (!customerEmail.includes('@')) {
      alert("Por favor, insira um e-mail válido.");
      return;
    }

    setPaymentLoading(true);

    try {
      // 1. Create order in Firebase first
      const orderData = {
        customerName,
        customerPhone,
        customerEmail,
        items,
        total,
        status: 'novo',
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'orders'), orderData);

      // 2. Call backend to create preference
      const response = await fetch('/api/create_preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          customerName,
          customerPhone,
          customerEmail
        }),
      });

      const data = await response.json();
      
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        const errorMsg = data.error || 'Não foi possível gerar o link de pagamento. Verifique se o token é válido.';
        alert("Erro no Mercado Pago: " + errorMsg);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orders');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!customerName || !customerPhone) {
      alert("Por favor, preencha seu nome e telefone.");
      return;
    }

    setIsFinishing(true);

    try {
      // 1. Save to Firebase
      const orderData = {
        customerName,
        customerPhone,
        customerEmail,
        items,
        total,
        status: 'novo',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'orders'), orderData);
      setOrderComplete(true);
      const finalWhatsapp = (whatsappNumber || STORE_INFO.whatsapp).replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${finalWhatsapp}?text=${getWhatsappFinalMessage(customerName)}`;
      window.open(whatsappUrl, '_blank');

      if (onClearCart) onClearCart();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orders');
    } finally {
      setIsFinishing(false);
    }
  };

  if (orderComplete) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={onClose} 
              className="fixed inset-0 bg-black/95 z-[60] backdrop-blur-xl" 
            />
            <motion.div 
              initial={{ x: '100%', opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: '100%', opacity: 0 }} 
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-black border-l border-zinc-900 z-[70] shadow-2xl flex flex-col items-center justify-center p-10 text-center"
            >
              <div className="relative mb-8">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
                  className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center"
                >
                  <CheckCircle2 size={56} strokeWidth={1.5} />
                </motion.div>
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-green-500/20 rounded-full -z-10" 
                />
              </div>

              <div className="space-y-4 mb-10">
                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white leading-none">
                  Pedido <span className="text-zinc-500">Confirmado!</span>
                </h2>
                <div className="space-y-2">
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Tudo certo, <span className="text-white font-bold">{customerName}</span>! 
                    Seu pedido foi registrado em nossa base de dados.
                  </p>
                  <p className="text-brand-yellow text-xs font-bold uppercase tracking-widest">
                    Aguarde... Abrindo WhatsApp
                  </p>
                </div>
              </div>

              <div className="w-full grid gap-4">
                <button 
                  onClick={() => { onClose(); setOrderComplete(false); }} 
                  className="w-full bg-white text-black font-black uppercase py-4 rounded-md text-sm transition-transform active:scale-95 shadow-xl shadow-white/5"
                >
                  Página Inicial
                </button>
                <button 
                  onClick={() => {
                    const finalWhatsapp = (whatsappNumber || STORE_INFO.whatsapp).replace(/\D/g, '');
                    const whatsappUrl = `https://wa.me/${finalWhatsapp}?text=${getWhatsappFinalMessage(customerName)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors py-2"
                >
                  Reabrir WhatsApp
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 z-[60] backdrop-blur-md"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-black border-l border-zinc-800 z-[70] shadow-2xl flex flex-col pt-safe"
            id="cart-drawer"
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="bg-brand-yellow p-2 rounded-sm shadow-lg shadow-brand-yellow/10">
                  <ShoppingBag size={20} className="text-black" />
                </div>
                <h2 className="text-xl font-black italic tracking-tighter uppercase">Seu Carrinho</h2>
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {items.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2 group"
                id="close-cart"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Fechar</span>
                <X size={20} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-hide">
              <AnimatePresence mode="popLayout" initial={false}>
                {items.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-6 text-center"
                  >
                    <div className="relative">
                      <ShoppingBag size={80} strokeWidth={1} className="text-zinc-800" />
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="absolute -bottom-2 -right-2 bg-red-500 rounded-full p-2"
                      >
                        <X size={20} className="text-white" />
                      </motion.div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-black text-white uppercase tracking-tighter">Carrinho Vazio</p>
                      <p className="text-sm max-w-[200px] text-zinc-500">Parece que você ainda não escolheu nada para sua casa.</p>
                    </div>
                    <button
                      onClick={onClose}
                      className="bg-brand-yellow text-black px-10 py-4 rounded-sm font-black uppercase text-xs hover:bg-brand-gold transition-all shadow-2xl shadow-brand-yellow/10"
                    >
                      Explorar Produtos
                    </button>
                  </motion.div>
                ) : (
                  items.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: -20 }}
                      className="flex gap-4 p-4 bg-zinc-900 rounded border border-zinc-800 relative group overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1 h-0 group-hover:h-full bg-brand-yellow transition-all duration-300" />
                      <div className="relative shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-24 h-24 object-cover rounded shadow-lg bg-zinc-800"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          onClick={() => onRemove(item.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="flex-grow min-w-0 flex flex-col">
                        <h4 className="text-sm font-bold uppercase leading-tight line-clamp-2 text-zinc-100">{item.name}</h4>
                        <p className="text-brand-yellow text-lg font-black mt-1">
                          R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="flex items-center bg-black border border-zinc-800 rounded-sm">
                            <button
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="p-1.5 hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-xs font-bold font-mono text-zinc-100">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="p-1.5 hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                            Subtotal: R$ {(item.price * item.quantity).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {items.length > 0 && (
              <div className="p-6 bg-zinc-900 border-t border-zinc-800 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
                    <span>Subtotal</span>
                    <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between text-2xl font-black italic tracking-tighter uppercase">
                    <span>Total</span>
                    <span className="text-brand-yellow">
                      R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                
                <p className="text-[10px] text-zinc-500 text-center uppercase tracking-[0.2em] font-bold">
                  Ou em 12x de R$ {(total / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem juros
                </p>

                <div className="space-y-4 bg-zinc-950/50 p-5 rounded-lg border border-zinc-800/50 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-brand-yellow rounded-full" />
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Informações de Entrega</p>
                  </div>
                  <div className="space-y-3">
                    <div className="group relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-yellow transition-colors" />
                      <input 
                        type="text" 
                        placeholder="Seu Nome Completo"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full bg-zinc-900/80 border border-zinc-800 rounded-md px-10 py-3 text-xs focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow/20 outline-none transition-all placeholder:text-zinc-600"
                      />
                    </div>
                    <div className="group relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-yellow transition-colors" />
                      <input 
                        type="text" 
                        placeholder="WhatsApp (DDD + Número)"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        className="w-full bg-zinc-900/80 border border-zinc-800 rounded-md px-10 py-3 text-xs focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow/20 outline-none transition-all placeholder:text-zinc-600"
                      />
                    </div>
                    <div className="group relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-yellow transition-colors" />
                      <input 
                        type="email" 
                        placeholder="E-mail para confirmação"
                        value={customerEmail}
                        required
                        onChange={e => setCustomerEmail(e.target.value)}
                        className="w-full bg-zinc-900/80 border border-zinc-800 rounded-md px-10 py-3 text-xs focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow/20 outline-none transition-all placeholder:text-zinc-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={isFinishing || paymentLoading}
                    onClick={handleMercadoPagoCheckout}
                    className="flex items-center justify-center gap-3 w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-md font-black uppercase text-sm shadow-xl shadow-blue-600/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <CreditCard size={20} className="group-hover:rotate-12 transition-transform" />
                    {paymentLoading ? 'Conectando...' : 'Pagar Agora (Cartão/Pix)'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={isFinishing || paymentLoading}
                    onClick={handleCheckout}
                    className="flex items-center justify-center gap-3 w-full bg-zinc-100 hover:bg-white text-black py-4 rounded-md font-black uppercase text-sm shadow-xl shadow-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    id="checkout-whatsapp"
                  >
                    <MessageCircle size={20} className="text-green-600 group-hover:scale-110 transition-transform" />
                    {isFinishing ? 'Salvando...' : 'Comprar via WhatsApp'}
                  </motion.button>
                  <button
                    onClick={onClose}
                    className="w-full text-zinc-500 hover:text-white py-2 font-bold uppercase text-[10px] tracking-[0.2em] transition-colors"
                  >
                    ← Continuar Navegando
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
