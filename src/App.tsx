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
  LogOut
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
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-8 flex-1">
          <div className="text-2xl font-black tracking-tighter text-brand-yellow italic">
            ETERNOS<span className="text-white">MÓVEIS</span>
          </div>
          <div className="relative flex-1 max-w-xl hidden md:block">
            <input
              type="text"
              placeholder="O que você está procurando?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-black py-2 px-4 rounded-sm outline-none text-sm pr-12"
              id="main-search"
            />
            <button className="absolute right-0 top-0 bottom-0 bg-brand-yellow px-4 flex items-center hover:bg-brand-gold transition-colors">
              <Search className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 ml-6">
          <a href={`https://wa.me/${(settings?.whatsapp || STORE_INFO.whatsapp).replace(/\D/g, '')}`} target="_blank" className="flex items-center gap-2 group">
            <div className="text-green-500 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6 fill-current" />
            </div>
            <span className="text-[10px] sm:text-xs font-semibold leading-tight hidden sm:block">
              {settings?.whatsapp || STORE_INFO.whatsapp}<br/>
              <span className="text-gray-400 font-normal">Fale agora</span>
            </span>
          </a>

          {!user ? (
            <button onClick={() => loginWithGoogle()} className="flex flex-col text-xs leading-tight group text-left">
              <span className="text-gray-400 group-hover:text-white">Bem-vindo!</span>
              <span className="font-bold border-b border-transparent group-hover:border-white transition-all">Minha Conta</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Olá,</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold line-clamp-1">{user.displayName || user.email}</p>
                  {isAdmin && (
                    <button 
                      onClick={() => setIsAdminPanelOpen(true)}
                      className="text-[9px] bg-brand-yellow/20 text-brand-yellow px-1.5 py-0.5 rounded border border-brand-yellow/20 hover:bg-brand-yellow/30"
                    >
                      ADMIN
                    </button>
                  )}
                </div>
              </div>
              <button 
                onClick={() => auth.signOut()}
                className="p-1.5 bg-white/5 hover:bg-red-500 hover:text-white rounded-sm transition-all"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}

          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 bg-brand-yellow rounded-sm hover:bg-brand-gold transition-colors"
            id="header-cart-btn"
          >
            <ShoppingCart size={24} className="text-black" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-black">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 2. MENU DE CATEGORIAS */}
      <nav className="bg-zinc-900 px-6 py-2 flex items-center gap-6 text-[11px] font-bold uppercase tracking-wider overflow-x-auto whitespace-nowrap scrollbar-hide border-b border-zinc-800">
        <button 
          onClick={() => setSelectedCategory('TODOS')}
          className={`bg-brand-yellow text-black px-4 py-1.5 rounded-sm flex items-center gap-2 cursor-pointer hover:bg-brand-gold transition-colors flex-shrink-0 ${selectedCategory === 'TODOS' ? 'ring-2 ring-white/50' : ''}`}
        >
          <Menu size={16} />
          TODOS OS DEPARTAMENTOS
        </button>
        {allCategories.map((cat, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedCategory(cat)}
            className={`hover:text-brand-yellow transition-colors relative pb-1 ${cat === 'Ofertas' ? 'text-red-500 animate-pulse' : 'text-gray-200'} ${selectedCategory === cat ? 'text-brand-yellow border-b-2 border-brand-yellow' : ''}`}
          >
            {cat}
          </button>
        ))}
      </nav>

      <main className="flex-grow">
        {/* 3. BANNER PRINCIPAL (HERO) */}
        <section className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            {banners.length > 0 ? (
              banners.map((banner, idx) => (
                <div key={idx} className="grid md:grid-cols-2 bg-zinc-900 rounded-lg overflow-hidden min-h-[320px] shadow-2xl relative border border-zinc-800">
                  <div className="p-8 md:p-12 flex flex-col justify-center gap-6 z-20">
                    <div className="space-y-1">
                      <h4 className="text-brand-yellow font-bold text-sm tracking-[0.2em] uppercase">{banner.subtitle}</h4>
                      <h1 className="text-4xl md:text-5xl font-black uppercase leading-[0.9] tracking-tighter">
                        {banner.title}
                      </h1>
                    </div>
                    <a 
                      href={banner.link}
                      className="bg-brand-yellow text-black font-black px-10 py-4 rounded-full w-fit text-sm hover:bg-brand-gold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-yellow/10"
                    >
                      CONFIRA AGORA
                    </a>
                  </div>
                  <div className="relative overflow-hidden hidden md:block">
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/40 to-transparent z-10" />
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
              <div className="grid md:grid-cols-2 bg-zinc-900 rounded-lg overflow-hidden min-h-[320px] shadow-2xl relative border border-zinc-800">
                <div className="p-8 md:p-12 flex flex-col justify-center gap-6 z-20">
                  <div className="space-y-1">
                    <h4 className="text-brand-yellow font-bold text-sm tracking-[0.2em] uppercase">OFERTAS IMPERDÍVEIS</h4>
                    <h1 className="text-4xl md:text-5xl font-black uppercase leading-[0.9] tracking-tighter">
                      TUDO PARA SUA CASA<br/>
                      <span className="text-brand-yellow">COM PREÇOS BAIXOS</span>
                    </h1>
                  </div>
                  <p className="text-gray-400 text-sm md:text-base max-w-sm leading-relaxed">
                    Móveis e eletrodomésticos com qualidade e o melhor preço em até 12x sem juros.
                  </p>
                  <button className="bg-brand-yellow text-black font-black px-10 py-4 rounded-full w-fit text-sm hover:bg-brand-gold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-yellow/10">
                    CONFIRA AS OFERTAS
                  </button>
                </div>
                <div className="relative overflow-hidden hidden md:block">
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/40 to-transparent z-10" />
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
        <section className="container mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="flex items-center gap-4 bg-zinc-900 p-4 rounded border border-zinc-800 group hover:border-brand-yellow/30 transition-all">
            <div className="w-10 h-10 rounded-full bg-brand-yellow/10 flex items-center justify-center text-brand-yellow font-black group-hover:scale-110 transition-transform">
              $
            </div>
            <div className="text-[10px] uppercase font-black text-gray-400 leading-tight">
              Até 12x<br/><span className="text-white text-xs">No Cartão</span>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-zinc-900 p-4 rounded border border-zinc-800 group hover:border-brand-yellow/30 transition-all">
            <div className="w-10 h-10 rounded-full bg-brand-yellow/10 flex items-center justify-center text-brand-yellow transition-transform group-hover:scale-110">
              <Truck size={18} />
            </div>
            <div className="text-[10px] uppercase font-black text-gray-400 leading-tight">
              Entrega<br/><span className="text-white text-xs">Rápida & Segura</span>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-zinc-900 p-4 rounded border border-zinc-800 group hover:border-brand-yellow/30 transition-all">
            <div className="w-10 h-10 rounded-full bg-brand-yellow/10 flex items-center justify-center text-brand-yellow font-black transition-transform group-hover:scale-110">
              ✓
            </div>
            <div className="text-[10px] uppercase font-black text-gray-400 leading-tight">
              Compra<br/><span className="text-white text-xs">Garantida</span>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-zinc-900 p-4 rounded border border-zinc-800 group hover:border-brand-yellow/30 transition-all">
            <div className="w-10 h-10 rounded-full bg-brand-yellow/10 flex items-center justify-center text-brand-yellow font-black transition-transform group-hover:scale-110">
              W
            </div>
            <div className="text-[10px] uppercase font-black text-gray-400 leading-tight">
              Vendas<br/><span className="text-white text-xs">Pelo WhatsApp</span>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-zinc-900 p-4 rounded border border-zinc-800 group hover:border-brand-yellow/30 transition-all">
            <div className="w-10 h-10 rounded-full bg-brand-yellow/10 flex items-center justify-center text-brand-yellow font-black transition-transform group-hover:scale-110">
              L
            </div>
            <div className="text-[10px] uppercase font-black text-gray-400 leading-tight">
              Showroom<br/><span className="text-white text-xs">Centro Itapeva</span>
            </div>
          </div>
        </section>

        {/* 5. SEÇÃO "OFERTAS EM DESTAQUE" */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black border-l-4 border-brand-yellow pl-4 uppercase italic tracking-tighter">
                Ofertas em Destaque
              </h2>
              <button className="text-[10px] text-brand-yellow font-black hover:underline uppercase tracking-[0.2em]">
                Ver todos
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
        <section className="bg-zinc-900 border-y border-zinc-800 py-16">
          <div className="container mx-auto px-4 text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
                COMPRE PELO <span className="text-brand-yellow">WHATSAPP</span>
              </h2>
              <p className="text-gray-400 max-w-lg mx-auto text-sm md:text-base">
                Nossos consultores estão online agora para tirar suas dúvidas e negociar o melhor preço.
              </p>
            </div>
            
            <a 
              href={STORE_INFO.whatsappUrl}
              target="_blank"
              className="inline-flex items-center gap-3 bg-brand-yellow hover:bg-brand-gold text-black font-black px-12 py-5 rounded-full text-base transition-all hover:scale-105 shadow-2xl shadow-brand-yellow/10"
              id="cta-whatsapp-section"
            >
              <MessageCircle size={24} />
              CONVERSE COM UM CONSULTOR
            </a>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-4">
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-black tracking-widest uppercase">
                <Clock size={16} className="text-brand-yellow" /> ATENDIMENTO EM MINUTOS
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-black tracking-widest uppercase">
                <ShieldCheck size={16} className="text-brand-yellow" /> COMPRA 100% SEGURA
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
