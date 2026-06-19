/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Customer, Transaction, User, DatabaseConfig, AccountantPermissions } from './types';

const CUSTOMERS_KEY = 'debt_app_customers_v1';
const TRANSACTIONS_KEY = 'debt_app_transactions_v1';
const AUTH_KEY = 'debt_app_auth_v1';
const USERS_KEY = 'debt_app_users_v1';
const DB_CONFIG_KEY = 'debt_app_db_config_v1';
const PERMISSIONS_KEY = 'debt_app_accountant_perms_v1';

const DEFAULT_USERS: User[] = [
  {
    id: 'u1',
    username: 'admin',
    password: '123',
    fullName: 'المدير العام',
    role: 'admin',
    createdAt: '2026-05-01T10:00:00.000Z'
  },
  {
    id: 'u2',
    username: 'accountant',
    password: '123',
    fullName: 'المحاسب المسؤول',
    role: 'accountant',
    createdAt: '2026-05-01T10:00:00.000Z'
  }
];

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

export function getAuthState(): { isAuthenticated: boolean; username: string; role?: 'admin' | 'accountant' } {
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

export function saveAuthState(state: { isAuthenticated: boolean; username: string; role?: 'admin' | 'accountant' }): void {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving auth state', e);
  }
}

export function getUsers(): User[] {
  try {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error fetching users', error);
    return DEFAULT_USERS;
  }
}

export function saveUsers(users: User[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users', error);
  }
}

export function getDatabaseConfig(): DatabaseConfig {
  try {
    const data = localStorage.getItem(DB_CONFIG_KEY);
    if (!data) {
      const config: DatabaseConfig = {
        type: 'postgresql',
        status: 'connected',
        lastSync: new Date().toISOString(),
        host: 'ma4s0o.h.filess.io',
        port: '61008',
        databaseName: 'Psql_afraidbuy',
        username: 'Psql_afraidbuy',
        password: '37e90624a6a16be82ccb8339cddc1e93c120460d',
        ssl: true,
        tableName: 'customers_transactions'
      };
      localStorage.setItem(DB_CONFIG_KEY, JSON.stringify(config));
      return config;
    }
    const parsed = JSON.parse(data);
    // If it was local or unconfigured with host, pre-populate the PostgreSQL fields so they're instantly ready
    if (!parsed.host) {
      parsed.type = 'postgresql';
      parsed.host = 'ma4s0o.h.filess.io';
      parsed.port = '61008';
      parsed.databaseName = 'Psql_afraidbuy';
      parsed.username = 'Psql_afraidbuy';
      parsed.password = '37e90624a6a16be82ccb8339cddc1e93c120460d';
      parsed.ssl = true;
      parsed.tableName = parsed.tableName || 'customers_transactions';
    }
    return parsed;
  } catch (error) {
    console.error('Error fetching database config', error);
    return {
      type: 'postgresql',
      status: 'connected',
      host: 'ma4s0o.h.filess.io',
      port: '61008',
      databaseName: 'Psql_afraidbuy',
      username: 'Psql_afraidbuy',
      password: '37e90624a6a16be82ccb8339cddc1e93c120460d',
      ssl: true,
      tableName: 'customers_transactions'
    };
  }
}

export function saveDatabaseConfig(config: DatabaseConfig): void {
  try {
    localStorage.setItem(DB_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving database config', error);
  }
}

export function getAccountantPermissions(): AccountantPermissions {
  try {
    const data = localStorage.getItem(PERMISSIONS_KEY);
    if (!data) {
      const defaultPermissions: AccountantPermissions = {
        deleteCustomer: false,
        modifyTransactions: true,
        viewDbConfig: false,
        viewBackup: false,
        viewUsersList: false,
        viewDashboard: true,
      };
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(defaultPermissions));
      return defaultPermissions;
    }
    const parsed = JSON.parse(data);
    return {
      deleteCustomer: parsed.deleteCustomer ?? false,
      modifyTransactions: parsed.modifyTransactions ?? true,
      viewDbConfig: parsed.viewDbConfig ?? false,
      viewBackup: parsed.viewBackup ?? false,
      viewUsersList: parsed.viewUsersList ?? false,
      viewDashboard: parsed.viewDashboard ?? true,
    };
  } catch (error) {
    console.error('Error fetching accountant permissions', error);
    return { 
      deleteCustomer: false, 
      modifyTransactions: true,
      viewDbConfig: false,
      viewBackup: false,
      viewUsersList: false,
      viewDashboard: true,
    };
  }
}

export function saveAccountantPermissions(perms: AccountantPermissions): void {
  try {
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(perms));
  } catch (error) {
    console.error('Error saving accountant permissions', error);
  }
}

export function getTheme(): 'light' | 'dark' {
  try {
    const val = localStorage.getItem('theme');
    return val === 'dark' ? 'dark' : 'light';
  } catch (error) {
    return 'light';
  }
}

export function saveTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem('theme', theme);
  } catch (error) {
    console.error('Error saving theme', error);
  }
}
