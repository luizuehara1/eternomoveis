/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: string;
  discount?: number | null;
  description: string;
  featured?: boolean;
  stock?: number;
  active?: boolean;
  tag?: 'Oferta' | 'Lançamento' | 'Mais Vendido' | '';
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: CartItem[];
  total: number;
  status: 'novo' | 'em atendimento' | 'vendido' | 'cancelado';
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  active: boolean;
}

export interface StoreSettings {
  id: string;
  whatsapp: string;
  address: string;
  shippingInfo: string;
}

export interface AdminUser {
  email: string;
  role: 'admin' | 'editor';
}
