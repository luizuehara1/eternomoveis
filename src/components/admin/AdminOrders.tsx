/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MessageCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  ChevronRight,
  User,
  Phone,
  Download,
  Calendar,
  Mail
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Order } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [monthFilter, setMonthFilter] = useState<string>('todos');
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());

  const YEARS = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
  const MONTHS = [
    { value: '0', label: 'Janeiro' },
    { value: '1', label: 'Fevereiro' },
    { value: '2', label: 'Março' },
    { value: '3', label: 'Abril' },
    { value: '4', label: 'Maio' },
    { value: '5', label: 'Junho' },
    { value: '6', label: 'Julho' },
    { value: '7', label: 'Agosto' },
    { value: '8', label: 'Setembro' },
    { value: '9', label: 'Outubro' },
    { value: '10', label: 'Novembro' },
    { value: '11', label: 'Dezembro' },
  ];

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Order);
      setOrders(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });
    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Erro ao atualizar status.");
    }
  };

  const filteredOrders = orders.filter(o => {
    const date = new Date(o.createdAt);
    const matchesSearch = o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.customerPhone.includes(searchTerm);
    const matchesStatus = statusFilter === 'todos' || o.status === statusFilter;
    const matchesMonth = monthFilter === 'todos' || date.getMonth().toString() === monthFilter;
    const matchesYear = yearFilter === 'todos' || date.getFullYear().toString() === yearFilter;
    
    return matchesSearch && matchesStatus && matchesMonth && matchesYear;
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Data", "Cliente", "E-mail", "WhatsApp", "Total", "Status"];
    const tableRows: any[] = [];

    filteredOrders.forEach(order => {
      const orderData = [
        new Date(order.createdAt).toLocaleDateString('pt-BR'),
        order.customerName,
        order.customerEmail || '-',
        order.customerPhone,
        `R$ ${order.total.toLocaleString('pt-BR')}`,
        order.status.toUpperCase()
      ];
      tableRows.push(orderData);
    });

    const monthLabel = monthFilter === 'todos' ? 'Todos' : MONTHS.find(m => m.value === monthFilter)?.label;
    
    doc.setFontSize(18);
    doc.text("Relatório de Pedidos - Eternos Multimarcas", 14, 22);
    doc.setFontSize(11);
    doc.text(`Período: ${monthLabel} / ${yearFilter}`, 14, 30);
    doc.text(`Total de Pedidos: ${filteredOrders.length}`, 14, 37);
    doc.text(`Faturamento: R$ ${filteredOrders.reduce((acc, curr) => acc + curr.total, 0).toLocaleString('pt-BR')}`, 14, 44);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [255, 215, 0], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    doc.save(`pedidos_${monthLabel}_${yearFilter}.pdf`);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'novo': return 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20';
      case 'em atendimento': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'vendido': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelado': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-zinc-800 text-zinc-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter decoration-brand-yellow decoration-4 underline-offset-8 underline">
          Gestão de Pedidos
        </h2>
        <button 
          onClick={exportToPDF}
          disabled={filteredOrders.length === 0}
          className="bg-zinc-900 border border-zinc-800 text-white font-black uppercase px-6 py-3 rounded flex items-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
        >
          <Download size={18} className="text-brand-yellow" /> Exportar PDF
        </button>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou WhatsApp do cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-10 py-3 text-sm focus:border-brand-yellow outline-none transition-colors"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded pl-10 pr-4 py-3 text-sm focus:border-brand-yellow outline-none transition-colors text-white appearance-none"
            >
              <option value="todos">Todos os Status</option>
              <option value="novo">Novos</option>
              <option value="em atendimento">Em Atendimento</option>
              <option value="vendido">Vendidos</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <select 
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded pl-10 pr-4 py-3 text-sm focus:border-brand-yellow outline-none transition-colors text-white appearance-none"
            >
              <option value="todos">Todos os Meses</option>
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <select 
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded pl-10 pr-4 py-3 text-sm focus:border-brand-yellow outline-none transition-colors text-white appearance-none"
            >
              <option value="todos">Todos os Anos</option>
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredOrders.map(order => (
          <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl hover:border-brand-yellow/30 transition-all group">
            <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div className="flex items-center justify-between md:justify-start gap-4">
                  <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Clock size={12} /> {new Date(order.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-white font-black text-lg">
                    <User size={18} className="text-brand-yellow" />
                    {order.customerName}
                  </div>
                  {order.customerEmail && (
                    <div className="flex items-center gap-2 text-zinc-400 text-xs">
                      <Mail size={12} className="text-zinc-500" />
                      {order.customerEmail}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <Phone size={14} />
                    {order.customerPhone}
                    <a 
                      href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`} 
                      target="_blank" 
                      className="ml-2 text-green-500 hover:text-green-400"
                      title="Chamar no WhatsApp"
                    >
                      <MessageCircle size={16} />
                    </a>
                  </div>
                </div>

                <div className="bg-black/40 rounded-lg p-4 space-y-2">
                  <p className="text-[10px] font-black uppercase text-zinc-500 mb-2">Produtos do Pedido</p>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-zinc-300">
                        <span className="text-brand-yellow font-bold">{item.quantity}x</span> {item.name}
                      </span>
                      <span className="text-white font-mono">
                        R$ {(item.price * item.quantity).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-zinc-800 mt-2 pt-2 flex justify-between font-black text-lg text-brand-yellow uppercase italic">
                    <span>Total</span>
                    <span>R$ {order.total.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 md:w-48">
                <p className="text-[10px] font-black uppercase text-zinc-500 mb-2">Alterar Status</p>
                <button 
                  onClick={() => updateOrderStatus(order.id, 'em atendimento')}
                  className="w-full py-2 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20"
                >
                  Em Atendimento
                </button>
                <button 
                  onClick={() => updateOrderStatus(order.id, 'vendido')}
                  className="w-full py-2 rounded bg-green-500/10 text-green-500 text-[10px] font-bold uppercase hover:bg-green-500 hover:text-white transition-all border border-green-500/20"
                >
                  Confirmar Venda
                </button>
                <button 
                  onClick={() => updateOrderStatus(order.id, 'cancelado')}
                  className="w-full py-2 rounded bg-red-500/10 text-red-500 text-[10px] font-bold uppercase hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredOrders.length === 0 && (
          <div className="p-20 text-center text-zinc-500 italic">Nenhum pedido encontrado.</div>
        )}
      </div>
    </div>
  );
}
