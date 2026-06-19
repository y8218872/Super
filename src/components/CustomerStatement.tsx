/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { Customer, Transaction, TransactionType } from '../types';
import { 
  ArrowLeft, Printer, Calendar, Search, Filter, Plus, 
  ArrowUpRight, ArrowDownLeft, Trash2, Mail, Phone, MapPin, 
  BookOpen, FileText, Download, CheckCircle2, ChevronDown
} from 'lucide-react';
import { motion } from 'motion/react';

interface CustomerStatementProps {
  customer: Customer;
  transactions: Transaction[];
  onBack: () => void;
  onAddTransaction: () => void;
  onDeleteTransaction: (id: string) => void;
}

export default function CustomerStatement({ 
  customer, 
  transactions, 
  onBack, 
  onAddTransaction,
  onDeleteTransaction 
}: CustomerStatementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // References for printing action
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Filter transactions for this developer/client
  const customerTx = useMemo(() => {
    return transactions
      .filter(t => t.customerId === customer.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Chronological for running balance
  }, [transactions, customer.id]);

  // Calculate Running Balance for Chronological list
  const transactionsWithRunningBalance = useMemo(() => {
    let running = 0;
    return customerTx.map(tx => {
      if (tx.type === 'debit') {
        running += tx.amount; // debit means they owe us more
      } else {
        running -= tx.amount; // credit means they paid
      }
      return {
        ...tx,
        runningBalance: running
      };
    });
  }, [customerTx]);

  // Apply filters to chronological list, but we can display newest first for ledger listing
  const filteredTx = useMemo(() => {
    return transactionsWithRunningBalance.filter(tx => {
      // Search matches description or amount
      const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            tx.amount.toString().includes(searchTerm);
      
      // Type matches choice
      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      
      // Date range matches
      const matchesStartDate = !startDate || new Date(tx.date) >= new Date(startDate);
      const matchesEndDate = !endDate || new Date(tx.date) <= new Date(endDate);
      
      return matchesSearch && matchesType && matchesStartDate && matchesEndDate;
    }).reverse(); // Display newest first in listing for user convenience
  }, [transactionsWithRunningBalance, searchTerm, typeFilter, startDate, endDate]);

  // Summary widgets based on selected/filtered period
  const totals = useMemo(() => {
    let debitsVal = 0;
    let creditsVal = 0;
    
    // We compute total based on the filtered results to make the report reactive to date ranges
    filteredTx.forEach(tx => {
      if (tx.type === 'debit') debitsVal += tx.amount;
      else creditsVal += tx.amount;
    });

    // Real overall balance for the customer
    const totalDebitOverall = customerTx.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
    const totalCreditOverall = customerTx.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    const overallBalance = totalDebitOverall - totalCreditOverall;

    return {
      filteredDebit: debitsVal,
      filteredCredit: creditsVal,
      overallBalance,
    };
  }, [filteredTx, customerTx]);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 shadow-sm transition flex items-center gap-1.5 cursor-pointer text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4 ml-1" />
            <span>العودة للرئيسية</span>
          </button>
          
          <div className="v-divider h-6 w-px bg-slate-300 hidden sm:block" />
          
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <span>كشف حساب العميل:</span>
              <span className="text-indigo-700">{customer.name}</span>
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">سجل كامل للحركات الدائنة والمدينة والرصيد التراكمي</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onAddTransaction}
            className="flex-grow sm:flex-none py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-indigo-100 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل معاملة مالية</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span className="hidden xs:inline">طباعة الكشف</span>
          </button>
        </div>
      </div>

      {/* Profile Card & Real-time Balance Box */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">بيانات العميل الشخصية</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
                <Phone className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold">رقم الجوال</p>
                <p className="text-sm font-semibold text-slate-700 font-mono select-all">{customer.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
                <Mail className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold">البريد الإلكتروني</p>
                <p className="text-sm font-semibold text-slate-700 select-all truncate max-w-[150px]">
                  {customer.email || '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
                <MapPin className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold">العنوان الشخصي</p>
                <p className="text-sm font-semibold text-slate-700 truncate max-w-[180px]">
                  {customer.address || '—'}
                </p>
              </div>
            </div>
          </div>

          {customer.notes && (
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100/70 text-amber-900 text-xs leading-relaxed">
              <strong>ملاحظات هامة:</strong> {customer.notes}
            </div>
          )}
        </div>

        {/* Dynamic Outstanding Debt / Balance Widget */}
        <div className={`rounded-2xl p-6 border relative overflow-hidden flex flex-col justify-between ${
          totals.overallBalance > 0 
            ? 'bg-rose-50 border-rose-200 text-rose-900' 
            : totals.overallBalance < 0 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}>
          {/* Decorative faint icon */}
          <div className="absolute top-2 left-2 opacity-10">
            <BookOpen className="w-20 h-20" />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">الرصيد الإجمالي الحالي</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold font-mono text-left tracking-tight">
                {Math.abs(totals.overallBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold">ريال</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-black/5">
            <span className="text-xs font-bold block">حالة الحساب المستحق:</span>
            <span className="text-sm font-extrabold block mt-1">
              {totals.overallBalance > 0 
                ? '🔴 مطلوب منه (مدين للشركة) بمبلغ' 
                : totals.overallBalance < 0 
                  ? '🟢 دائن للشركة (له مبالغ مسبقة)' 
                  : '✔️ متزن (لا توجد مستحقات معلقة)'}
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Filter and Control Drawer */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>تصفية ومعاينة كشف الحساب بالتاريخ والنوع</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Term Search */}
          <div className="relative">
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="ابحث بالبيان أو بالمبلغ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-xs font-medium text-slate-800"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-xs font-semibold text-slate-800 appearance-none"
            >
              <option value="all">كل المعاملات المتاحة</option>
              <option value="debit">المعاملة: مدين (+) (مشتريات/ديون)</option>
              <option value="credit">المعاملة: دائن (-) (تسديدات/مدفوعات)</option>
            </select>
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="w-4 h-4" />
            </span>
          </div>

          {/* Date range inputs */}
          <div className="flex items-center gap-2 md:col-span-2">
            <div className="relative flex-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none transition text-xs text-slate-800"
              />
              <span className="absolute top-[-8px] right-2 bg-white px-1 text-[10px] text-slate-400 font-bold">من تاريخ</span>
            </div>

            <div className="text-slate-300 font-bold">إلى</div>

            <div className="relative flex-1">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none transition text-xs text-slate-800"
              />
              <span className="absolute top-[-8px] right-2 bg-white px-1 text-[10px] text-slate-400 font-bold">حتى تاريخ</span>
            </div>

            {/* Clear Filters indicator */}
            {(searchTerm || typeFilter !== 'all' || startDate || endDate) && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl transition text-xs font-bold cursor-pointer inline-flex items-center gap-1 shrink-0"
              >
                <span>إعادة ضبط</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reactive calculations widgets based on current list filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold">مجموع الديون بالآجل (مدين +)</p>
            <p className="text-base font-extrabold text-rose-600 font-mono mt-1">
              {totals.filteredDebit.toLocaleString('en-US')} ريال
            </p>
          </div>
          <span className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
            <ArrowUpRight className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold">إجمالي التسديدات المستلمة (دائن -)</p>
            <p className="text-base font-extrabold text-emerald-600 font-mono mt-1">
              {totals.filteredCredit.toLocaleString('en-US')} ريال
            </p>
          </div>
          <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <ArrowDownLeft className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold">عدد معاملات الفلترة الحالية</p>
            <p className="text-base font-extrabold text-slate-700 font-mono mt-1">
              {filteredTx.length} معاملة
            </p>
          </div>
          <span className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
            <FileText className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* Main Ledger Tables */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="statement-print-area" ref={printAreaRef}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-slate-700">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span className="font-extrabold text-sm sm:text-base">جدول القيود والمعاملات التفصيلي</span>
          </div>
          <span className="text-[11px] bg-indigo-50 border border-indigo-100 text-indigo-800 py-1 px-2.5 rounded-full font-bold">
            ترتيب الحركات التراكمي مفعل
          </span>
        </div>

        {filteredTx.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-slate-50 border border-slate-200/60 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Search className="w-6 h-6 text-slate-300" />
            </div>
            <h4 className="text-slate-800 font-bold text-sm">لم يتم العثور على أي معاملات مالية تطابق فلتر العميل</h4>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
              تأكد من اختيار نطاق زمني أكبر أو قم بإعادة تصفية الحركات المسجلة للوصول للمطلوب.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold select-none">
                  <th className="py-3.5 px-6 font-bold w-32">تاريخ المعاملة</th>
                  <th className="py-3.5 px-6 font-bold">البيان والتفاصيل</th>
                  <th className="py-3.5 px-6 font-bold text-center w-28 bg-rose-500/[0.02]">مدين (+)</th>
                  <th className="py-3.5 px-6 font-bold text-center w-28 bg-emerald-500/[0.02]">دائن (-)</th>
                  <th className="py-3.5 px-6 font-bold text-center w-36 bg-slate-50 border-r border-slate-100">الرصيد المتبقي</th>
                  <th className="py-3.5 px-6 text-center w-20">خيارات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                    {/* Date */}
                    <td className="py-3.5 px-6 font-mono font-semibold text-slate-600 whitespace-nowrap">
                      {tx.date}
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-6 font-medium text-slate-800 leading-relaxed max-w-xs md:max-w-md">
                      {tx.description}
                    </td>

                    {/* Debit Column (+ Outstanding) */}
                    <td className="py-3.5 px-6 text-center font-mono font-bold text-rose-600 bg-rose-500/[0.01]">
                      {tx.type === 'debit' ? (
                        <span className="inline-flex items-center gap-1">
                          <span>+</span>
                          <span>{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 font-normal">—</span>
                      )}
                    </td>

                    {/* Credit Column (- Debt) */}
                    <td className="py-3.5 px-6 text-center font-mono font-bold text-emerald-600 bg-emerald-500/[0.01]">
                      {tx.type === 'credit' ? (
                        <span className="inline-flex items-center gap-1">
                          <span>-</span>
                          <span>{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 font-normal">—</span>
                      )}
                    </td>

                    {/* Running cumulative Balance */}
                    <td className={`py-3.5 px-6 text-center font-mono font-extrabold border-r border-slate-100 ${
                      tx.runningBalance > 0 
                        ? 'text-rose-700 bg-rose-50/40' 
                        : tx.runningBalance < 0 
                          ? 'text-emerald-700 bg-emerald-50/40' 
                          : 'text-slate-700 bg-slate-50'
                    }`}>
                      <span className="inline-flex items-center gap-1">
                        <span>{Math.abs(tx.runningBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[10px] font-bold">
                          {tx.runningBalance > 0 ? 'مدين' : tx.runningBalance < 0 ? 'دائن' : 'متزن'}
                        </span>
                      </span>
                    </td>

                    {/* Options/Deletion */}
                    <td className="py-3.5 px-6 text-center">
                      {confirmDeleteId === tx.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              onDeleteTransaction(tx.id);
                              setConfirmDeleteId(null);
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
                          >
                            تأكيد
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-600 text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(tx.id)}
                          className="p-1 px-2.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg border border-slate-100 transition inline-flex items-center justify-center cursor-pointer"
                          title="حذف القيد المعاملة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hidden layout specifically for print formatting styling in browser */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #statement-print-area, #statement-print-area * {
            visibility: visible;
          }
          #statement-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
          }
          /* Custom layout rules for print beauty */
          th {
            background-color: #f8fafc !important;
            color: #000 !important;
          }
          td, th {
            border: 1px solid #cbd5e1 !important;
            padding: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}
