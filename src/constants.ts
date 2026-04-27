/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from './types';

export const STORE_INFO = {
  name: 'Eternos Móveis',
  address: 'R. Rui Barbosa, 391 - Centro, Itapeva - SP, 18410-060',
  whatsapp: '+55 15 99808-0350',
  whatsappUrl: 'https://wa.me/5515998080350',
};

export const CATEGORIES = [
  'Móveis',
  'Eletrodomésticos',
  'Colchões',
  'Sala',
  'Quarto',
  'Cozinha',
  'Eletroportáteis',
  'Ofertas',
  'Lançamentos',
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Sofá Retrátil e Reclinável 3 Lugares Veludo',
    price: 2499.90,
    originalPrice: 3299.00,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800',
    category: 'Sala',
    discount: 24,
    description: 'Sofá de alto padrão, conforto absoluto com espuma Pro-Form.',
    featured: true,
  },
  {
    id: '2',
    name: 'Geladeira Inox Frost Free 450L',
    price: 3899.00,
    originalPrice: 4500.00,
    image: 'https://images.unsplash.com/photo-1571175432244-934c11867c29?auto=format&fit=crop&q=80&w=800',
    category: 'Cozinha',
    discount: 13,
    description: 'Tecnologia de ponta para conservar seus alimentos por muito mais tempo.',
    featured: true,
  },
  {
    id: '3',
    name: 'Cama Box Casal + Colchão de Molas Ensacadas',
    price: 1899.90,
    originalPrice: 2400.00,
    image: 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&q=80&w=800',
    category: 'Quarto',
    discount: 20,
    description: 'Noites de sono tranquilas com suporte ergonômico.',
    featured: true,
  },
  {
    id: '4',
    name: 'Conjunto Mesa de Jantar 6 Cadeiras Tampo de Vidro',
    price: 1599.00,
    originalPrice: 1999.00,
    image: 'https://images.unsplash.com/photo-1617806118233-f8e137453673?auto=format&fit=crop&q=80&w=800',
    category: 'Sala',
    discount: 20,
    description: 'Design moderno e resistência para suas reuniões em família.',
    featured: true,
  },
  {
    id: '5',
    name: 'Guarda-Roupa Casal 6 Portas com Espelho',
    price: 1299.90,
    originalPrice: 1600.00,
    image: 'https://images.unsplash.com/photo-1595428774223-ef0486e4c49d?auto=format&fit=crop&q=80&w=800',
    category: 'Quarto',
    discount: 18,
    description: 'Amplo espaço interno com divisórias inteligentes.',
    featured: true,
  },
  {
    id: '6',
    name: 'Painel para TV até 65 Polegadas com LED',
    price: 599.00,
    originalPrice: 899.00,
    image: 'https://images.unsplash.com/photo-1593784991095-a205039470b6?auto=format&fit=crop&q=80&w=800',
    category: 'Sala',
    discount: 33,
    description: 'Acabamento premium com iluminação LED integrada.',
    featured: true,
  },
  {
    id: '7',
    name: 'Cozinha Compacta 4 Peças com Balcão',
    price: 1100.00,
    originalPrice: 1450.00,
    image: 'https://images.unsplash.com/photo-1556912177-f51b0c01244e?auto=format&fit=crop&q=80&w=800',
    category: 'Cozinha',
    discount: 24,
    description: 'Praticidade e elegância para o seu dia a dia na cozinha.',
    featured: true,
  },
  {
    id: '8',
    name: 'Fritadeira Elétrica Air Fryer 4L Digital',
    price: 349.90,
    originalPrice: 499.00,
    image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=800',
    category: 'Eletroportáteis',
    discount: 30,
    description: 'Saúde e sabor com tecnologia de circulação de ar quente.',
    featured: true,
  },
];
