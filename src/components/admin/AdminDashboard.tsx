/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Clock
} from 'lucide-react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Product, Order } from '../../types';

interface AdminDashboardProps {
  onNavigate?: (tab: any) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    newOrders: 0,
    lowStock: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const productsSnap = await getDocs(collection(db, 'products'));
        const ordersSnap = await getDocs(collection(db, 'orders'));
        
        const products = productsSnap.docs.map(doc => doc.data() as Product);
        const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Order);
        
        setStats({
          totalProducts: productsSnap.size,
          totalOrders: ordersSnap.size,
          newOrders: orders.filter(o => o.status === 'novo').length,
          lowStock: products.filter(p => (p.stock || 0) < 5).length
        });

        // Get 5 most recent orders
        const recent = orders
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        setRecentOrders(recent);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'stats');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total de Produtos', value: stats.totalProducts, icon: Package, color: 'text-blue-500' },
    { label: 'Total de Pedidos', value: stats.totalOrders, icon: ShoppingCart, color: 'text-green-500' },
    { label: 'Novos Pedidos', value: stats.newOrders, icon: TrendingUp, color: 'text-brand-yellow', alert: stats.newOrders > 0 },
    { label: 'Estoque Baixo', value: stats.lowStock, icon: AlertTriangle, color: 'text-red-500', alert: stats.lowStock > 0 },
  ];

  if (loading) return <div className="p-8 text-center animate-pulse text-zinc-500">Carregando dashboard...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-brand-yellow/20 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-black group-hover:scale-110 transition-transform ${card.color}`}>
                <card.icon size={24} />
              </div>
              {card.alert && (
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{card.label}</p>
            <h3 className="text-3xl font-black italic">{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-black uppercase italic tracking-tighter flex items-center gap-2">
              <Clock size={18} className="text-brand-yellow" />
              Pedidos Recentes
            </h3>
            <button 
              onClick={() => onNavigate?.('orders')}
              className="text-[10px] font-black text-brand-yellow uppercase hover:underline"
            >
              Ver Todos
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black text-[10px] font-black uppercase text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold">{order.customerName}</td>
                    <td className="px-6 py-4 text-zinc-500">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 font-black">R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        order.status === 'novo' ? 'bg-brand-yellow/10 text-brand-yellow' :
                        order.status === 'vendido' ? 'bg-green-500/10 text-green-500' :
                        'bg-zinc-800 text-zinc-500'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 italic">Nenhum pedido recente.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
          <h3 className="font-black uppercase italic tracking-tighter flex items-center gap-2 border-b border-zinc-800 pb-4">
            <Users size={18} className="text-brand-yellow" />
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={() => onNavigate?.('products')}
              className="w-full bg-brand-yellow text-black font-black uppercase py-4 rounded text-xs hover:bg-brand-gold transition-all shadow-xl shadow-brand-yellow/5"
            >
              Cadastrar Produto
            </button>
            <button 
              onClick={() => onNavigate?.('banners')}
              className="w-full bg-white/5 text-white font-black uppercase py-4 rounded text-xs hover:bg-white/10 transition-all border border-zinc-800"
            >
              Gerenciar Banners
            </button>
            <button 
              onClick={() => onNavigate?.('settings')}
              className="w-full bg-white/5 text-white font-black uppercase py-4 rounded text-xs hover:bg-white/10 transition-all border border-zinc-800"
            >
              Configurações Loja
            </button>
            <button 
              onClick={() => onNavigate?.('orders')}
              className="w-full bg-red-500/10 text-red-500 font-black uppercase py-4 rounded text-xs hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
            >
              Exportar Pedidos PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
