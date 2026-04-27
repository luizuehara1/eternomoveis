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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/90 z-[60] backdrop-blur-md" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-full max-w-md bg-black border-l border-zinc-800 z-[70] shadow-2xl flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Pedido Enviado!</h2>
                <p className="text-zinc-500 text-sm">Obrigado pela preferência, {customerName}! Já estamos abrindo o seu WhatsApp para finalizar.</p>
              </div>
              <button onClick={() => { onClose(); setOrderComplete(false); }} className="bg-brand-yellow text-black font-black uppercase px-8 py-3 rounded-full text-xs">
                Voltar à Loja
              </button>
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
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-6 text-center">
                  <div className="relative">
                    <ShoppingBag size={80} strokeWidth={1} />
                    <X size={32} className="absolute -bottom-2 -right-2 text-red-500" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-white uppercase tracking-tighter">Carrinho Vazio</p>
                    <p className="text-sm max-w-[200px]">Adicione produtos para começar suas compras.</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="bg-brand-yellow text-black px-8 py-3 rounded-sm font-black uppercase text-xs hover:bg-brand-gold transition-all shadow-xl shadow-brand-yellow/5"
                  >
                    Ver Ofertas
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-zinc-900 rounded border border-zinc-800 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-0 group-hover:h-full bg-brand-yellow transition-all duration-300" />
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-24 h-24 object-cover rounded shadow-lg bg-white"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-grow min-w-0 flex flex-col">
                      <h4 className="text-sm font-bold uppercase leading-tight line-clamp-2">{item.name}</h4>
                      <p className="text-brand-yellow text-lg font-black mt-1">
                        R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center bg-black border border-zinc-800 rounded-sm">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="p-1.5 hover:bg-zinc-800 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-xs font-bold font-mono">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="p-1.5 hover:bg-zinc-800 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => onRemove(item.id)}
                          className="text-[10px] font-black uppercase text-red-500 hover:text-red-400 tracking-widest flex items-center gap-1"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
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

                <div className="space-y-4 bg-black/40 p-4 rounded border border-zinc-800">
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest text-center">Seus Dados para Contato</p>
                  <div className="space-y-3">
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input 
                        type="text" 
                        placeholder="Nome Completo"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-10 py-2.5 text-xs focus:border-brand-yellow outline-none transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input 
                        type="text" 
                        placeholder="WhatsApp (Ex: 11 99999-9999)"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-10 py-2.5 text-xs focus:border-brand-yellow outline-none transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input 
                        type="email" 
                        placeholder="Seu Melhor E-mail"
                        value={customerEmail}
                        required
                        onChange={e => setCustomerEmail(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-10 py-2.5 text-xs focus:border-brand-yellow outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <button
                    disabled={isFinishing || paymentLoading}
                    onClick={handleMercadoPagoCheckout}
                    className="flex items-center justify-center gap-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-sm font-black uppercase text-sm shadow-xl shadow-blue-900/20 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    <CreditCard size={20} />
                    {paymentLoading ? 'Processando...' : 'Pagar com Mercado Pago'}
                  </button>
                  <button
                    disabled={isFinishing || paymentLoading}
                    onClick={handleCheckout}
                    className="flex items-center justify-center gap-3 w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-sm font-black uppercase text-sm shadow-xl shadow-green-900/20 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                    id="checkout-whatsapp"
                  >
                    <MessageCircle size={20} />
                    {isFinishing ? 'Processando...' : 'Finalizar no WhatsApp'}
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-sm font-bold uppercase text-[10px] tracking-widest transition-all"
                  >
                    Continuar Comprando
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
