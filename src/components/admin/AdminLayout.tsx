/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Image as ImageIcon, 
  Settings, 
  LogOut, 
  X,
  Menu
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import AdminProducts from './AdminProducts';
import AdminOrders from './AdminOrders';
import AdminBanners from './AdminBanners';
import AdminSettings from './AdminSettings';
import { auth } from '../../lib/firebase';

interface AdminLayoutProps {
  onClose: () => void;
}

type AdminTab = 'dashboard' | 'products' | 'orders' | 'banners' | 'settings';

export default function AdminLayout({ onClose }: AdminLayoutProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { id: 'banners', label: 'Banners', icon: ImageIcon },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboard onNavigate={setActiveTab} />;
      case 'products': return <AdminProducts />;
      case 'orders': return <AdminOrders />;
      case 'banners': return <AdminBanners />;
      case 'settings': return <AdminSettings />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex animate-in fade-in duration-300">
      {/* Sidebar */}
      <aside className={`bg-zinc-900 border-r border-zinc-800 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center justify-between border-b border-zinc-800">
          <div className={`font-black italic text-brand-yellow uppercase tracking-tighter ${isSidebarOpen ? 'text-xl' : 'hidden'}`}>
            ADMIN <span className="text-white">ETERNOS</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-grow p-4 space-y-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all group ${
                activeTab === item.id 
                  ? 'bg-brand-yellow text-black' 
                  : 'text-zinc-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={22} className={activeTab === item.id ? 'text-black' : 'group-hover:scale-110 transition-transform'} />
              {isSidebarOpen && <span className="font-black uppercase italic text-xs tracking-widest">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button 
            onClick={onClose}
            className="w-full flex items-center gap-4 p-4 rounded-xl text-red-500 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={22} />
            {isSidebarOpen && <span className="font-black uppercase italic text-xs tracking-widest">Sair do Painel</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col overflow-hidden bg-black">
        <header className="h-20 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-900/50 backdrop-blur-xl">
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-white">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Gerente Geral</span>
              <span className="text-xs font-black text-white">{auth.currentUser?.displayName || auth.currentUser?.email}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-brand-yellow flex items-center justify-center font-black text-black italic">
              {(auth.currentUser?.displayName || '?')[0].toUpperCase()}
            </div>
          </div>
        </header>
        
        <div className="flex-grow overflow-y-auto p-8 scrollbar-hide">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
