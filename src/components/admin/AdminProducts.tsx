/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Tag,
  DollarSign,
  Package,
  Image as ImageIcon
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Product } from '../../types';
import { CATEGORIES, INITIAL_PRODUCTS } from '../../constants';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORIES[0],
    price: '',
    originalPrice: '',
    stock: '',
    image: '',
    description: '',
    tag: '',
    active: true,
    featured: false
  });

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product);
      setProducts(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });
    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      category: CATEGORIES[0],
      price: '',
      originalPrice: '',
      stock: '',
      image: '',
      description: '',
      tag: '',
      active: true,
      featured: false
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      stock: product.stock?.toString() || '',
      image: product.image,
      description: product.description,
      tag: product.tag || '',
      active: product.active ?? true,
      featured: product.featured ?? false
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(formData.price);
    const originalPriceNum = formData.originalPrice ? parseFloat(formData.originalPrice) : null;
    let discount = null;
    if (originalPriceNum && originalPriceNum > priceNum) {
      discount = Math.round(((originalPriceNum - priceNum) / originalPriceNum) * 100);
    }

    const productData = {
      ...formData,
      price: priceNum,
      originalPrice: originalPriceNum,
      stock: parseInt(formData.stock) || 0,
      discount,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, editingProduct ? OperationType.UPDATE : OperationType.CREATE, 'products');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente excluir este produto?")) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  const handleImportInitial = async () => {
    if (confirm("Deseja importar os 8 produtos iniciais do site para o seu banco de dados?")) {
      try {
        for (const product of INITIAL_PRODUCTS) {
          const { id, ...data } = product;
          await addDoc(collection(db, 'products'), {
            ...data,
            active: true,
            createdAt: new Date().toISOString()
          });
        }
        alert("Produtos importados com sucesso!");
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'products/import');
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter decoration-brand-yellow decoration-4 underline-offset-8 underline">
          Gestão de Produtos
        </h2>
        <div className="flex items-center gap-3">
          {products.length === 0 && (
            <button 
              onClick={handleImportInitial}
              className="bg-zinc-800 text-white font-bold uppercase text-xs px-4 py-3 rounded border border-zinc-700 hover:bg-zinc-700 transition-all"
            >
              Importar Iniciais
            </button>
          )}
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-brand-yellow text-black font-black uppercase px-6 py-3 rounded flex items-center gap-2 hover:bg-brand-gold transition-all shadow-xl shadow-brand-yellow/10"
          >
            <Plus size={18} /> Novo Produto
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-10 py-3 text-sm focus:border-brand-yellow outline-none transition-colors"
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black text-[10px] font-black uppercase text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Preço</th>
                <th className="px-6 py-4">Estoque</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <img src={product.image} className="w-10 h-10 object-cover rounded bg-black" />
                    <div>
                      <p className="font-bold">{product.name}</p>
                      {product.tag && <span className="text-[9px] text-brand-yellow bg-brand-yellow/10 px-1 rounded uppercase">{product.tag}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 uppercase text-xs font-semibold text-zinc-400">{product.category}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-black">R$ {product.price.toLocaleString('pt-BR')}</span>
                      {product.originalPrice && <span className="text-[10px] text-zinc-500 line-through">R$ {product.originalPrice.toLocaleString('pt-BR')}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${product.stock && product.stock < 10 ? 'text-red-500' : 'text-zinc-300'}`}>
                      {product.stock || 0} unid.
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {product.active ? (
                      <span className="flex items-center gap-1 text-green-500 font-bold text-[10px] uppercase">
                        <CheckCircle size={12} /> Ativo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-zinc-500 font-bold text-[10px] uppercase">
                        <XCircle size={12} /> Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(product)} className="p-2 text-zinc-400 hover:text-brand-yellow">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 text-zinc-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="p-20 text-center text-zinc-500 italic">Nenhum produto encontrado.</div>
          )}
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-[110] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-xl font-black italic uppercase tracking-tighter">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 scrollbar-hide grid md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Nome</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-sm focus:border-brand-yellow outline-none" placeholder="Ex: Geladeira Frost Free" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Categoria</label>
                <div className="flex gap-2">
                  <select 
                    value={CATEGORIES.includes(formData.category) ? formData.category : 'CUSTOM'} 
                    onChange={e => {
                      if (e.target.value === 'CUSTOM') {
                        setFormData({...formData, category: ''});
                      } else {
                        setFormData({...formData, category: e.target.value});
                      }
                    }} 
                    className="flex-1 bg-black border border-zinc-800 rounded px-4 py-3 text-sm focus:border-brand-yellow outline-none"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    <option value="CUSTOM">+ Outra...</option>
                  </select>
                  {!CATEGORIES.includes(formData.category) && (
                    <input 
                      required
                      type="text" 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      placeholder="Nova categoria"
                      className="flex-1 bg-black border border-zinc-800 rounded px-4 py-3 text-sm focus:border-brand-yellow outline-none animate-in fade-in zoom-in duration-300"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Preço Atual (R$)</label>
                <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-sm focus:border-brand-yellow outline-none" placeholder="0.00" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Preço Original (Opcional - R$)</label>
                <input type="number" step="0.01" value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-sm focus:border-brand-yellow outline-none" placeholder="0.00" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Estoque (unid)</label>
                <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-sm focus:border-brand-yellow outline-none" placeholder="0" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Selo/Tag</label>
                <select value={formData.tag} onChange={e => setFormData({...formData, tag: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-sm focus:border-brand-yellow outline-none">
                  <option value="">Nenhum</option>
                  <option value="Oferta">Oferta</option>
                  <option value="Lançamento">Lançamento</option>
                  <option value="Mais Vendido">Mais Vendido</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">URL da Imagem</label>
                <input required type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-sm focus:border-brand-yellow outline-none" placeholder="https://..." />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Descrição</label>
                <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-sm focus:border-brand-yellow outline-none" placeholder="Detalhes do produto..."></textarea>
              </div>

              <div className="flex items-center gap-8 md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="w-5 h-5 accent-brand-yellow" />
                  <span className="text-xs font-bold uppercase tracking-widest">Produto Ativo</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.featured} onChange={e => setFormData({...formData, featured: e.target.checked})} className="w-5 h-5 accent-brand-yellow" />
                  <span className="text-xs font-bold uppercase tracking-widest">Destaque na Home</span>
                </label>
              </div>

              <div className="md:col-span-2 pt-4">
                <button type="submit" className="w-full bg-brand-yellow text-black font-black uppercase py-4 rounded hover:bg-brand-gold transition-all shadow-xl shadow-brand-yellow/10">
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
