/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Customer, Transaction } from './types';

const CUSTOMERS_KEY = 'debt_app_customers_v1';
const TRANSACTIONS_KEY = 'debt_app_transactions_v1';
const AUTH_KEY = 'debt_app_auth_v1';

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'محمود أحمد العتيبي',
    phone: '0501234567',
    email: 'mahmoud@example.com',
    address: 'الرياض، السليمانية',
    notes: 'عميل توريد مواد إنشائية منتظم',
    createdAt: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'c2',
    name: 'شركة الوفاء للمقاولات',
    phone: '0559876543',
    email: 'info@alwafaa.com',
    address: 'جدة، حي الروضة',
    notes: 'حساب توريد ومقاولات عامة',
    createdAt: '2026-05-10T12:00:00.000Z',
  },
  {
    id: 'c3',
    name: 'فاطمة عمر الزهراني',
    phone: '0543210987',
    email: 'fatimah@example.com',
    address: 'الدمام، حي المنار',
    notes: 'عميلة لمتجر التصميم والديكور',
    createdAt: '2026-06-01T14:30:00.000Z',
  },
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  // محمود أحمد العتيبي
  {
    id: 't1',
    customerId: 'c1',
    type: 'debit', // مدين (يأخذ بضاعة/أدين بكذا) -> رصيد عليه يرتفع
    amount: 15000,
    date: '2026-05-05',
    description: 'شراء مواد بناء (حديد وأسمنت) بالآجل',
    createdAt: '2026-05-05T10:30:00.000Z',
  },
  {
    id: 't2',
    customerId: 'c1',
    type: 'credit', // دائن (يسدد أو يدفع) -> رصيد عليه ينخفض
    amount: 5000,
    date: '2026-05-15',
    description: 'دفعة نقدية تحت الحساب',
    createdAt: '2026-05-15T11:00:00.000Z',
  },
  {
    id: 't3',
    customerId: 'c1',
    type: 'debit',
    amount: 3200,
    date: '2026-06-02',
    description: 'شراء أدوات دهانات ومستلزمات صيانة',
    createdAt: '2026-06-02T09:15:00.000Z',
  },

  // شركة الوفاء للمقاولات
  {
    id: 't4',
    customerId: 'c2',
    type: 'debit',
    amount: 45000,
    date: '2026-05-10',
    description: 'فاتورة أعمال حفر وخرسانة مسلحة',
    createdAt: '2026-05-10T13:00:00.000Z',
  },
  {
    id: 't5',
    customerId: 'c2',
    type: 'credit',
    amount: 30000,
    date: '2026-05-25',
    description: 'حوالة بنكية صادرة من الشركة',
    createdAt: '2026-05-25T16:45:00.000Z',
  },
  {
    id: 't6',
    customerId: 'c2',
    type: 'credit',
    amount: 15000,
    date: '2026-06-12',
    description: 'تسوية حساب ودفعة نقدية أخيرة',
    createdAt: '2026-06-12T10:00:00.000Z',
  },

  // فاطمة عمر الزهراني
  {
    id: 't7',
    customerId: 'c3',
    type: 'debit',
    amount: 7800,
    date: '2026-06-05',
    description: 'طلب أثاث مخصص (طاولة طعام وستائر كلاسيك)',
    createdAt: '2026-06-05T15:00:00.000Z',
  },
  {
    id: 't8',
    customerId: 'c3',
    type: 'credit',
    amount: 4000,
    date: '2026-06-10',
    description: 'عربون مقدم نقداً',
    createdAt: '2026-06-10T11:20:00.000Z',
  },
];

export function getCustomers(): Customer[] {
  try {
    const data = localStorage.getItem(CUSTOMERS_KEY);
    if (!data) {
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(DEFAULT_CUSTOMERS));
      return DEFAULT_CUSTOMERS;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error fetching customers', error);
    return DEFAULT_CUSTOMERS;
  }
}

export function saveCustomers(customers: Customer[]): void {
  try {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  } catch (error) {
    console.error('Error saving customers', error);
  }
}

export function getTransactions(): Transaction[] {
  try {
    const data = localStorage.getItem(TRANSACTIONS_KEY);
    if (!data) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(DEFAULT_TRANSACTIONS));
      return DEFAULT_TRANSACTIONS;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error fetching transactions', error);
    return DEFAULT_TRANSACTIONS;
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving transactions', error);
  }
}

export function getAuthState(): { isAuthenticated: boolean; username: string } {
  try {
    const data = localStorage.getItem(AUTH_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error fetching auth state', e);
  }
  return { isAuthenticated: false, username: '' };
}

export function saveAuthState(state: { isAuthenticated: boolean; username: string }): void {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving auth state', e);
  }
}
