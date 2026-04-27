/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  ChevronRight,
  GripVertical
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Banner } from '../../types';

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: '',
    link: '#',
    active: true
  });

  useEffect(() => {
    const q = query(collection(db, 'banners'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Banner);
      setBanners(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'banners');
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'banners'), formData);
      setIsModalOpen(false);
      setFormData({ title: '', subtitle: '', image: '', link: '#', active: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'banners');
    }
  };

  const toggleBannerStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'banners', id), { active: !currentStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `banners/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja excluir este banner?")) {
      try {
        await deleteDoc(doc(db, 'banners', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `banners/${id}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter decoration-brand-yellow decoration-4 underline-offset-8 underline">
          Banner Promocional (Home)
        </h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-yellow text-black font-black uppercase px-6 py-3 rounded flex items-center gap-2 hover:bg-brand-gold transition-all shadow-xl shadow-brand-yellow/10"
        >
          <Plus size={18} /> Novo Banner
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {banners.map(banner => (
          <div key={banner.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl group flex flex-col">
            <div className="relative aspect-video bg-black overflow-hidden">
              <img src={banner.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={banner.title} />
              {!banner.active && <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center font-black uppercase italic text-zinc-500 tracking-tighter text-2xl">Inativo</div>}
              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={() => toggleBannerStatus(banner.id, banner.active)}
                  className={`p-2 rounded-full backdrop-blur-md transition-all ${banner.active ? 'bg-green-500/20 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}
                >
                  {banner.active ? <CheckCircle size={18} /> : <XCircle size={18} />}
                </button>
                <button onClick={() => handleDelete(banner.id)} className="p-2 rounded-full bg-red-500/20 text-red-500 backdrop-blur-md">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-2 flex-grow">
              <h3 className="font-black italic uppercase text-lg leading-tight">{banner.title}</h3>
              <p className="text-zinc-500 text-sm">{banner.subtitle}</p>
            </div>
          </div>
        ))}
        {banners.length === 0 && !loading && (
          <div className="md:col-span-2 p-20 border-2 border-dashed border-zinc-800 rounded-xl text-center text-zinc-500 italic">
            Nenhum banner cadastrado.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-[110] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Novo Banner</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-500">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Título do Banner</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-sm focus:border-brand-yellow outline-none" placeholder="Ex: Oferta de Natal" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Subtítulo</label>
                <input required type="text" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-sm focus:border-brand-yellow outline-none" placeholder="Ex: Descontos de até 50%" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">URL da Imagem</label>
                <input required type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-sm focus:border-brand-yellow outline-none" placeholder="https://..." />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Link de Destino</label>
                <input type="text" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-sm focus:border-brand-yellow outline-none" placeholder="#" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="w-5 h-5 accent-brand-yellow" id="banner-active" />
                <label htmlFor="banner-active" className="text-xs font-black uppercase tracking-widest cursor-pointer">Banner Ativo</label>
              </div>
              <button type="submit" className="w-full bg-brand-yellow text-black font-black uppercase py-4 rounded hover:bg-brand-gold shadow-xl shadow-brand-yellow/10 transition-all">
                Criar Banner
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
