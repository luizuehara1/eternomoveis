/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { 
  Save, 
  MapPin, 
  MessageCircle, 
  Truck, 
  Globe, 
  ShieldCheck,
  Instagram,
  Facebook
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { StoreSettings } from '../../types';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>({
    id: 'main',
    whatsapp: '',
    address: '',
    shippingInfo: ''
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, 'settings', 'main');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as StoreSettings);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'settings/main');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'main'), settings);
      alert("Configurações salvas com sucesso!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/main');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500 animate-pulse">Carregando configurações...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-black italic uppercase tracking-tighter decoration-brand-yellow decoration-4 underline-offset-8 underline mb-8">
        Configurações da Loja
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-2xl">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
              <MessageCircle size={14} className="text-brand-yellow" /> WhatsApp da Loja
            </label>
            <input 
              required
              type="text" 
              value={settings.whatsapp}
              onChange={e => setSettings({...settings, whatsapp: e.target.value})}
              placeholder="+55 15 99808-0350"
              className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-sm focus:border-brand-yellow outline-none transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
              <MapPin size={14} className="text-brand-yellow" /> Endereço Completo
            </label>
            <textarea 
              required
              rows={3}
              value={settings.address}
              onChange={e => setSettings({...settings, address: e.target.value})}
              placeholder="R. Rui Barbosa, 391 - Centro, Itapeva - SP"
              className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-sm focus:border-brand-yellow outline-none transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
              <Truck size={14} className="text-brand-yellow" /> Informações de Entrega
            </label>
            <input 
              required
              type="text" 
              value={settings.shippingInfo}
              onChange={e => setSettings({...settings, shippingInfo: e.target.value})}
              placeholder="Entregamos em toda a região em até 48h"
              className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-sm focus:border-brand-yellow outline-none transition-colors"
            />
          </div>
        </div>

        <button 
          disabled={saving}
          type="submit"
          className="w-full bg-brand-yellow text-black font-black uppercase py-4 rounded hover:bg-brand-gold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-brand-yellow/10"
        >
          <Save size={18} />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
    </div>
  );
}
