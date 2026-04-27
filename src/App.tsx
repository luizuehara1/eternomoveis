/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Phone, 
  Menu, 
  Truck, 
  CreditCard, 
  ShieldCheck, 
  MapPin, 
  ChevronRight,
  MessageCircle,
  Clock,
  ArrowRight,
  LogOut,
  X
} from 'lucide-react';
import { collection, onSnapshot, query, limit, doc } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Product, CartItem } from './types';
import { STORE_INFO, CATEGORIES, INITIAL_PRODUCTS } from './constants';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import AdminLayout from './components/admin/AdminLayout';
import { db, auth, loginWithGoogle, handleFirestoreError, OperationType, checkIfAdmin } from './lib/firebase';
import { Banner, StoreSettings } from './types';

export default function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');
  const [notification, setNotification] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Handle Mercado Pago back urls
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status === 'success') {
      setNotification('Pagamento confirmado com sucesso! Entraremos em contato.');
      setCart([]);
      setTimeout(() => {
        window.history.replaceState({}, '', '/');
        setNotification(null);
      }, 5000);
    } else if (status === 'failure') {
      setNotification('Houve um erro no seu pagamento. Tente novamente.');
      setTimeout(() => setNotification(null), 5000);
    }
  }, []);

  // Sincronizar produtos com Firestore
  useEffect(() => {
    const q = query(collection(db, 'products'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Se o banco estiver vazio, mostramos os produtos iniciais do template
        setProducts(INITIAL_PRODUCTS);
      } else {
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsData.filter(p => p.active !== false));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return () => unsubscribe();
  }, []);

  // Sincronizar Banners
  useEffect(() => {
    const q = query(collection(db, 'banners'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Banner);
      setBanners(data.filter(b => b.active));
    }, (error) => {
      console.error("Banners listener error:", error);
      handleFirestoreError(error, OperationType.LIST, 'banners');
    });
    return () => unsubscribe();
  }, []);

  // Sincronizar Configurações
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as StoreSettings);
      }
    }, (error) => {
      console.error("Settings listener error:", error);
      handleFirestoreError(error, OperationType.GET, 'settings/main');
    });
    return () => unsubscribe();
  }, []);

  // Monitorar estado de autenticação e verificar Admin
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const adminStatus = await checkIfAdmin(u.email);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
    });
  }, []);

  const allCategories = useMemo(() => {
    const productCats = products.map(p => p.category);
    return Array.from(new Set([...CATEGORIES, ...productCats]));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'TODOS' || 
                             p.category === selectedCategory || 
                             (selectedCategory === 'Ofertas' && p.discount);
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, products, selectedCategory]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setNotification(`${product.name} adicionado ao carrinho!`);
    setTimeout(() => setNotification(null), 3000);
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden">
      {/* 1. HEADER SUPERIOR */}
      <header className="bg-black border-b border-zinc-800 px-4 md:px-6 py-2 md:py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4 md:gap-8 flex-1">
          <div className="text-xl md:text-2xl font-black tracking-tighter text-brand-yellow italic whitespace-nowrap">
            ETERNOS<span className="text-white">MÓVEIS</span>
          </div>
          <div className="relative flex-1 max-w-xl hidden lg:block">
            <input
              type="text"
              placeholder="O que você está procurando?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-black py-2 px-4 rounded-sm outline-none text-sm pr-12 focus:ring-2 focus:ring-brand-yellow"
            />
            <button className="absolute right-0 top-0 bottom-0 bg-brand-yellow px-4 flex items-center hover:bg-brand-gold transition-colors">
              <Search className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6 ml-2 md:ml-6">
          {/* Mobile Search Trigger */}
          <button className="lg:hidden p-2 text-white hover:text-brand-yellow" onClick={() => setIsSearchOpen(true)}>
            <Search size={22} />
          </button>

          <a href={`https://wa.me/${(settings?.whatsapp || STORE_INFO.whatsapp).replace(/\D/g, '')}`} target="_blank" className="flex items-center gap-2 group">
            <div className="text-green-500 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6 fill-current" />
            </div>
            <span className="text-[10px] sm:text-xs font-semibold leading-tight hidden lg:block">
              {settings?.whatsapp || STORE_INFO.whatsapp}<br/>
              <span className="text-gray-400 font-normal">Fale agora</span>
            </span>
          </a>

          {!user ? (
            <button onClick={() => loginWithGoogle()} className="flex items-center gap-2 text-left group">
              <User size={20} className="text-zinc-500 group-hover:text-white" />
              <div className="hidden sm:flex flex-col text-xs leading-tight">
                <span className="text-gray-400">Bem-vindo!</span>
                <span className="font-bold">Conta</span>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-2 md:gap-3">
              <div className="text-right hidden md:block">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Olá,</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold line-clamp-1">{user.displayName?.split(' ')[0]}</p>
                </div>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => setIsAdminPanelOpen(true)}
                  className="p-1.5 bg-brand-yellow/10 text-brand-yellow rounded hover:bg-brand-yellow/20"
                >
                  <ShieldCheck size={18} />
                </button>
              )}
            </div>
          )}

          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 bg-brand-yellow rounded-sm hover/bg-brand-gold transition-all active:scale-95"
            id="header-cart-btn"
          >
            <ShoppingCart size={22} className="text-black" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-black">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 bg-black/98 z-[100] p-6 lg:hidden backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="text-2xl font-black italic tracking-tighter text-brand-yellow">BUSCAR</div>
            <button onClick={() => setIsSearchOpen(false)}>
              <X size={32} className="text-white hover:rotate-90 transition-transform" />
            </button>
          </div>
          <div className="relative">
            <input
              autoFocus
              type="text"
              placeholder="O que você procura hoje?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setIsSearchOpen(false)}
              className="w-full bg-white text-black py-4 px-6 rounded-lg outline-none text-lg font-bold"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          </div>
          <div className="mt-8 space-y-4">
            <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em]">Sugestões:</p>
            <div className="flex flex-wrap gap-2">
              {['SOFÁ', 'GELADEIRA', 'MESA', 'ARMÁRIO', 'CAMA'].map(s => (
                <button 
                  key={s} 
                  onClick={() => {setSearchQuery(s); setIsSearchOpen(false);}} 
                  className="bg-zinc-800 text-white px-5 py-2.5 rounded-full text-xs font-black hover:bg-brand-yellow hover:text-black transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. MENU DE CATEGORIAS */}
      <nav className="bg-zinc-900 px-4 md:px-6 py-2 flex items-center gap-4 text-[10px] md:text-[11px] font-bold uppercase tracking-wider overflow-x-auto whitespace-nowrap no-scrollbar border-b border-zinc-800">
        <button 
          onClick={() => setSelectedCategory('TODOS')}
          className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded transition-all ${selectedCategory === 'TODOS' ? 'bg-brand-yellow text-black' : 'text-zinc-400 hover:text-white'}`}
        >
          <Menu size={14} />
          TODOS
        </button>
        <div className="w-[1px] h-4 bg-zinc-800 flex-shrink-0" />
        {allCategories.map((cat, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedCategory(cat)}
            className={`flex-shrink-0 transition-colors uppercase whitespace-nowrap ${cat === 'Ofertas' ? 'text-red-500' : ''} ${selectedCategory === cat ? 'text-brand-yellow font-black' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {cat}
          </button>
        ))}
      </nav>

      <main className="flex-grow">
        {/* 3. BANNER PRINCIPAL (HERO) */}
        <section className="container mx-auto px-4 py-4 md:py-6">
          <div className="space-y-4">
            {banners.length > 0 ? (
              banners.map((banner, idx) => (
                <div key={idx} className="grid md:grid-cols-2 bg-zinc-900 rounded-xl overflow-hidden min-h-[220px] md:min-h-[320px] shadow-2xl relative border border-zinc-800 group">
                  <div className="p-6 md:p-12 flex flex-col justify-center gap-4 md:gap-6 z-20 relative">
                    <div className="space-y-1">
                      <h4 className="text-brand-yellow font-bold text-[10px] md:text-sm tracking-[0.2em] uppercase">{banner.subtitle}</h4>
                      <h1 className="text-2xl md:text-5xl font-black uppercase leading-tight md:leading-[0.9] tracking-tighter max-w-[200px] md:max-w-none">
                        {banner.title}
                      </h1>
                    </div>
                    <a 
                      href={banner.link}
                      className="bg-brand-yellow text-black font-black px-6 md:px-10 py-3 md:py-4 rounded-full w-fit text-[10px] md:text-sm hover:bg-brand-gold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-yellow/10 uppercase"
                    >
                      Ver Detalhes
                    </a>
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 md:relative md:w-auto overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/60 to-transparent z-10 md:from-zinc-900 md:via-zinc-900/40" />
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-[2s]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="grid md:grid-cols-2 bg-zinc-900 rounded-xl overflow-hidden min-h-[220px] md:min-h-[380px] shadow-2xl relative border border-zinc-800 group">
                <div className="p-6 md:p-12 flex flex-col justify-center gap-4 md:gap-6 z-20 relative">
                  <div className="space-y-1">
                    <h4 className="text-brand-yellow font-bold text-[10px] md:text-sm tracking-[0.2em] uppercase">NOVIDADES 2024</h4>
                    <h1 className="text-2xl md:text-5xl font-black uppercase leading-tight md:leading-[0.9] tracking-tighter max-w-[200px] md:max-w-none">
                      CONFORTO & <span className="text-brand-yellow">ESTILO</span> PARA VOCÊ
                    </h1>
                  </div>
                  <p className="text-zinc-400 text-[10px] md:text-base max-w-[180px] md:max-w-sm leading-relaxed hidden sm:block">
                    Móveis com design exclusivo em até 12x sem juros. Entrega rápida para Itapeva e região.
                  </p>
                  <button className="bg-brand-yellow text-black font-black px-6 md:px-10 py-3 md:py-4 rounded-full w-fit text-[10px] md:text-sm hover:bg-brand-gold transition-all shadow-lg shadow-brand-yellow/10">
                    OFERTAS DA SEMANA
                  </button>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-1/2 md:relative md:w-auto overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/60 to-transparent z-10 md:from-zinc-900 md:via-zinc-900/40" />
                  <img
                    src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=1200"
                    alt="Sala Moderna"
                    className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-[2s]"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 4. BARRA DE BENEFÍCIOS */}
        <section className="container mx-auto px-4 py-2 flex items-stretch gap-3 overflow-x-auto no-scrollbar scroll-smooth">
          {[
            { icon: "$", title: "Até 12x", sub: "Sem Juros" },
            { icon: <Truck size={18} />, title: "Entrega", sub: "Rápida" },
            { icon: "✓", title: "Compra", sub: "Segura" },
            { icon: "W", title: "Vendas", sub: "WhatsApp" },
            { icon: "L", title: "Loja", sub: "Física" }
          ].map((b, i) => (
            <div key={i} className="flex-shrink-0 flex items-center gap-3 bg-zinc-900 p-3 rounded-lg border border-zinc-800 min-w-[140px] md:flex-1">
              <div className="w-8 h-8 rounded-full bg-brand-yellow/10 flex items-center justify-center text-brand-yellow text-xs font-black">
                {b.icon}
              </div>
              <div className="text-[9px] uppercase font-black text-zinc-500 leading-tight">
                {b.title}<br/><span className="text-white text-[10px]">{b.sub}</span>
              </div>
            </div>
          ))}
        </section>

        {/* 5. SEÇÃO "OFERTAS EM DESTAQUE" */}
        <section className="py-6 md:py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-black border-l-4 border-brand-yellow pl-4 uppercase italic tracking-tighter">
                Ofertas em Destaque
              </h2>
              <button className="text-[10px] text-brand-yellow font-black hover:underline uppercase tracking-[0.1em] md:tracking-[0.2em]">
                Ver todos
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {filteredProducts.map(product => {
                return (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={addToCart} 
                  />
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. CONVERSÃO WHATSAPP */}
        <section className="bg-zinc-900 border-y border-zinc-800 py-10 md:py-16">
          <div className="container mx-auto px-4 text-center space-y-6 md:space-y-8">
            <div className="space-y-2 md:space-y-4">
              <h2 className="text-2xl md:text-5xl font-black italic uppercase tracking-tighter leading-tight md:leading-none">
                COMPRE PELO <span className="text-brand-yellow">WHATSAPP</span>
              </h2>
              <p className="text-zinc-400 max-w-sm md:max-w-lg mx-auto text-xs md:text-base leading-relaxed">
                Nossos consultores estão online agora para tirar suas dúvidas e negociar o melhor preço.
              </p>
            </div>
            
            <a 
              href={STORE_INFO.whatsappUrl}
              target="_blank"
              className="inline-flex items-center gap-3 bg-brand-yellow hover:bg-brand-gold text-black font-black px-8 md:px-12 py-4 md:py-5 rounded-full text-xs md:text-base transition-all hover:scale-105 active:scale-95 shadow-xl shadow-brand-yellow/10 uppercase"
              id="cta-whatsapp-section"
            >
              <MessageCircle size={20} className="md:size-24" />
              Chamar Consultor
            </a>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 pt-4">
              <div className="flex items-center gap-2 text-[8px] md:text-[10px] text-zinc-500 font-black tracking-widest uppercase">
                <Clock size={14} className="text-brand-yellow" /> ATENDIMENTO IMEDIATO
              </div>
              <div className="flex items-center gap-2 text-[8px] md:text-[10px] text-zinc-500 font-black tracking-widest uppercase">
                <ShieldCheck size={14} className="text-brand-yellow" /> COMPRA SEGURA
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 7. RODAPÉ */}
      <footer className="bg-black px-6 py-12 border-t border-zinc-800">
        <div className="container mx-auto grid md:grid-cols-4 gap-12 text-[10px] uppercase font-bold tracking-wider">
          <div className="space-y-4">
            <div className="text-brand-yellow font-black text-xl italic tracking-tighter">ETERNOS MÓVEIS</div>
            <p className="text-gray-500 normal-case leading-relaxed font-normal">
              R. Rui Barbosa, 391 - Centro, Itapeva - SP, 18410-060<br/>
              © 2024 Eternos Móveis. Todos os direitos reservados.
            </p>
          </div>
          
          <div>
            <h5 className="text-white mb-6">DEPARTAMENTOS</h5>
            <ul className="space-y-3 text-gray-500 font-normal">
              {allCategories.slice(0, 5).map((cat, i) => (
                <li key={i}><button onClick={() => { setSelectedCategory(cat); window.scrollTo(0, 0); }} className="hover:text-brand-yellow transition-colors uppercase cursor-pointer">{cat}</button></li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-white mb-6">AJUDA & SUPORTE</h5>
            <ul className="space-y-3 text-gray-500 font-normal">
              <li><a href="#" className="hover:text-brand-yellow transition-colors">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-brand-yellow transition-colors">Entregas</a></li>
              <li><a href="#" className="hover:text-brand-yellow transition-colors">Trocas</a></li>
              <li><a href="#" className="hover:text-brand-yellow transition-colors">Privacidade</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h5 className="text-white">LOJA FÍSICA</h5>
            <div className="text-gray-500 normal-case font-normal space-y-2">
              <p className="flex items-center gap-2">
                <MapPin size={12} className="text-brand-yellow" />
                Centro, Itapeva - SP
              </p>
              <p className="flex items-center gap-2">
                <Clock size={12} className="text-brand-yellow" />
                Seg-Sex: 08:30 - 18:00
              </p>
              <a href={STORE_INFO.whatsappUrl} target="_blank" className="flex items-center gap-2 text-white font-black hover:text-brand-yellow transition-colors mt-4 block">
                <MessageCircle size={16} className="text-green-500" />
                CHAMAR NO WHATSAPP
              </a>
            </div>
          </div>
        </div>
      </footer>

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onClearCart={() => setCart([])}
        whatsappNumber={settings?.whatsapp}
      />

      {isAdminPanelOpen && (
        <AdminLayout onClose={() => setIsAdminPanelOpen(false)} />
      )}

      {/* Notificação de Toast */}
      {notification && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] bg-brand-yellow text-black px-6 py-3 rounded-full font-black uppercase text-xs shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <ShoppingCart size={16} />
          {notification}
        </div>
      )}
    </div>
  );
}
