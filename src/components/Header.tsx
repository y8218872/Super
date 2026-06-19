/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, LogOut, TrendingUp, TrendingDown, Users, Wallet } from 'lucide-react';

interface HeaderProps {
  username: string;
  onLogout: () => void;
  totalCustomers: number;
  totalDebitOverall: number;
  totalCreditOverall: number;
}

export default function Header({ 
  username, 
  onLogout, 
  totalCustomers, 
  totalDebitOverall, 
  totalCreditOverall 
}: HeaderProps) {
  
  const netDebtDifference = totalDebitOverall - totalCreditOverall;

  return (
    <header className="bg-white border-b border-slate-200 text-slate-800" dir="rtl">
      {/* Top tiny metadata nav with minimalist logout */}
      <div className="bg-slate-50 border-b border-slate-100 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            <span>برنامج إدارة حسابات الديون المبسط (مدين ودائن)</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">المحاسب:</span>
              <span className="text-indigo-600 font-bold">{username || 'مدير النظام'}</span>
            </div>
            <span className="text-slate-350">|</span>
            <button
              onClick={onLogout}
              className="hover:text-rose-600 transition flex items-center gap-1 font-bold cursor-pointer"
            >
              <span>تسجيل الخروج</span>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats Header Area in Clean Minimalism style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-8">
          {/* Brand/Subtitle */}
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100 shrink-0">
              د
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-950 tracking-tight">دفتر القيود والديون</h1>
              <p className="text-xs text-slate-400 font-medium mt-1">كشوفات مالية ومتابعة الأرصدة التراكمية في ثوانٍ</p>
            </div>
          </div>

          {/* Clean Minimalism stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-10 border-t lg:border-t-0 pt-6 lg:pt-0 border-slate-100 flex-grow max-w-4xl justify-end">
            {/* Stat: Total Debit (مدين - لنا) */}
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>إجمالي المدين (لنا)</span>
              </p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 font-mono">
                {totalDebitOverall.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-400">ر.س</span>
              </p>
            </div>

            {/* Stat: Total Credit (دائن - دفعات) */}
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                <span>إجمالي الدائن (علينا)</span>
              </p>
              <p className="text-xl sm:text-2xl font-bold text-rose-600 font-mono">
                {totalCreditOverall.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-400">ر.س</span>
              </p>
            </div>

            {/* Stat: Net remaining */}
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-indigo-600" />
                <span>صافي المستحقات</span>
              </p>
              <p className={`text-xl sm:text-2xl font-bold font-mono ${netDebtDifference >= 0 ? 'text-slate-900' : 'text-emerald-700'}`}>
                {netDebtDifference.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-400">ر.س</span>
              </p>
            </div>

            {/* Stat: Total Customers */}
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>العملاء المقيدين</span>
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800 font-mono">
                {totalCustomers} <span className="text-xs font-normal text-slate-400">أفراد/شركات</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
