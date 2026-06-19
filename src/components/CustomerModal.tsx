/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Customer, TransactionType } from '../types';
import { X, UserPlus, Save, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerData: Omit<Customer, 'id' | 'createdAt'>, initialBalance: { amount: number; type: TransactionType } | null) => void;
  customer?: Customer | null; // For editing
}

export default function CustomerModal({ isOpen, onClose, onSave, customer }: CustomerModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  
  // Initial Balance for new customer
  const [hasInitialBalance, setHasInitialBalance] = useState(false);
  const [initialBalanceAmount, setInitialBalanceAmount] = useState<number>(0);
  const [initialBalanceType, setInitialBalanceType] = useState<TransactionType>('debit');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
      setEmail(customer.email || '');
      setAddress(customer.address || '');
      setNotes(customer.notes || '');
      setHasInitialBalance(false);
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNotes('');
      setHasInitialBalance(false);
      setInitialBalanceAmount(0);
      setInitialBalanceType('debit');
    }
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const customerData = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const initialBalanceDetails = hasInitialBalance && initialBalanceAmount > 0
      ? { amount: initialBalanceAmount, type: initialBalanceType }
      : null;

    onSave(customerData, initialBalanceDetails);
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
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-800">
              {customer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-1.5 hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">الاسم كامل *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-sm text-slate-800"
              placeholder="مثال: صالح بن محمد الشمري"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">رقم الجوال *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-sm text-slate-800 font-mono text-left"
                placeholder="05xxxxxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">البريد الإلكتروني (اختياري)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-sm text-slate-800"
                placeholder="example@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">العنوان الحالي (اختياري)</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-sm text-slate-800"
              placeholder="مثال: الرياض، حي السليمانية، شارع التحلية"
            />
          </div>

          {/* Initial balance checkbox/section ONLY for brand new customer additions */}
          {!customer && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasInitialBalance}
                  onChange={(e) => setHasInitialBalance(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-semibold text-slate-700">تحديد رصيد افتتاحي (دين سابق)؟</span>
              </label>

              {hasInitialBalance && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 grid grid-cols-2 gap-3"
                >
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">المبلغ (ريال)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={initialBalanceAmount || ''}
                      onChange={(e) => setInitialBalanceAmount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">حالة الرصيد</label>
                    <select
                      value={initialBalanceType}
                      onChange={(e) => setInitialBalanceType(e.target.value as TransactionType)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500"
                    >
                      <option value="debit">مدين (مطلوب منه مال)</option>
                      <option value="credit">دائن (مسدد دفعات مقدماً)</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">ملاحظات عن العميل</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-sm text-slate-800 resize-none"
              placeholder="مثال: الاتفاق توريد آجل مع السداد شهرياً..."
            />
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ البيانات</span>
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
