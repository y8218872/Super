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

export interface AuthState {
  isAuthenticated: boolean;
  username: string;
}
