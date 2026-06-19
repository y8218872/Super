/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Customer, Transaction, TransactionType } from '../types';
import { X, PlusCircle, ArrowUpRight, ArrowDownLeft, FileText, Calendar, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => void;
  customer: Customer;
}

export default function TransactionModal({ isOpen, onClose, onSave, customer }: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('debit'); // default: مدين (عليه)
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setType('debit');
      // Set to local daily ISO date
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setDescription('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !date || !description.trim()) {
      return;
    }

    onSave({
      customerId: customer.id,
      type,
      amount: Number(amount),
      date,
      description: description.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">تسجيل معاملة مالية جديدة</h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">للعميل: {customer.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-1.5 hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Visual selector for Debt (مدين) or Payment (دائن) */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 text-center">نوع المعاملة المالية</label>
            <div className="grid grid-cols-2 gap-4">
              {/* Debit (عليه - مدين) */}
              <button
                type="button"
                onClick={() => setType('debit')}
                className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between h-24 cursor-pointer relative ${
                  type === 'debit'
                    ? 'border-rose-500 bg-rose-500/[0.04] ring-2 ring-rose-500/10'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`p-1.5 rounded-lg ${type === 'debit' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                  {type === 'debit' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute top-4 left-4" />
                  )}
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${type === 'debit' ? 'text-rose-700' : 'text-slate-700'}`}>مدين (له بضاعة / عليه دين)</h4>
                  <p className="text-[10px] text-slate-400 mt-1">العميل استلم منتج/قرض وزاد حسابه</p>
                </div>
              </button>

              {/* Credit (له - دائن) */}
              <button
                type="button"
                onClick={() => setType('credit')}
                className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between h-24 cursor-pointer relative ${
                  type === 'credit'
                    ? 'border-emerald-500 bg-emerald-500/[0.04] ring-2 ring-emerald-500/10'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`p-1.5 rounded-lg ${type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    <ArrowDownLeft className="w-4 h-4" />
                  </span>
                  {type === 'credit' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute top-4 left-4" />
                  )}
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${type === 'credit' ? 'text-emerald-700' : 'text-slate-700'}`}>دائن (سدد دفعة / له مستحقات)</h4>
                  <p className="text-[10px] text-slate-400 mt-1">العميل دفع مالاً وقلّ دينه المتبقي</p>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">المبلغ المالي (ريال) *</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-sm text-slate-800 font-bold"
                  placeholder="0.00"
                />
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none text-xs font-bold font-mono">ر.س</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">التاريخ *</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-sm text-slate-800"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">البيان / تفصيل المعاملة *</label>
            <div className="relative">
              <div className="absolute top-2.5 right-3.5 text-slate-400">
                <FileText className="w-5 h-5" />
              </div>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full pr-11 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-sm text-slate-800 resize-none leading-relaxed"
                placeholder="مثال: فاتورة رقم #827 - شراء 5 أكياس دهانات مع مستلزمات تركيب..."
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              className={`flex-grow py-2.5 px-4 text-white font-semibold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                type === 'debit' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <span>تسجيل المعاملة الآن</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm transition cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
