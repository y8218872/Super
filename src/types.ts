/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'debit' | 'credit'; // debit = مدين (عليه/يأخذ)، credit = دائن (له/يدفع)

export interface Transaction {
  id: string;
  customerId: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  createdAt: string;
  createdBy?: string; // اسم المستخدم الذي أضاف القيد
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: 'admin' | 'accountant';
  createdAt: string;
}

export interface DatabaseConfig {
  type: 'local' | 'cloud' | 'custom_api' | 'mysql' | 'postgresql' | 'sqlite' | 'oracle' | 'other';
  status: 'connected' | 'disconnected' | 'offline';
  apiUrl?: string;
  apiKey?: string;
  projectId?: string;
  lastSync?: string;
  host?: string;
  port?: string;
  databaseName?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  tableName?: string;
}

export interface AccountantPermissions {
  deleteCustomer: boolean;
  modifyTransactions: boolean;
  viewDbConfig: boolean;
  viewBackup: boolean;
  viewUsersList: boolean;
  viewDashboard: boolean;
}

export interface AutoBackupRestorePoint {
  id: string;
  name: string;
  timestamp: string;
  size: string;
  customersCount: number;
  transactionsCount: number;
  data: string;
}

export interface AutoBackupConfig {
  enabled: boolean;
  interval: 'every_change' | 'daily' | 'weekly' | 'hourly' | 'manual';
  renameWithDateTime: boolean;
  lastBackupTime?: string;
  autoRestorePoints: AutoBackupRestorePoint[];
}

export interface AuthState {
  isAuthenticated: boolean;
  username: string;
  role?: 'admin' | 'accountant';
  permissions?: AccountantPermissions;
}
