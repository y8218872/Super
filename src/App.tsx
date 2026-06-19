/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Customer, Transaction, AuthState, TransactionType } from './types';
import { 
  getCustomers, getTransactions, saveCustomers, saveTransactions, 
  getAuthState, saveAuthState 
} from './localStorage';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import CustomerModal from './components/CustomerModal';
import TransactionModal from './components/TransactionModal';
import CustomerStatement from './components/CustomerStatement';
import { 
  Plus, Users, Search, DollarSign, Wallet, Phone, 
  Trash2, Edit, ArrowLeftRight, CheckCircle2, AlertTriangle, UserPlus, BookOpen 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [auth, setAuth] = useState<AuthState>(getAuthState());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Selected customer for detailed Statement of Account ("كشف الحساب للعميل")
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Delete safety checks
  const [confirmDeleteCustomerId, setConfirmDeleteCustomerId] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    setCustomers(getCustomers());
    setTransactions(getTransactions());
  }, []);

  // Handle Login success
  const handleLoginSuccess = (username: string) => {
    const newState = { isAuthenticated: true, username };
    setAuth(newState);
    saveAuthState(newState);
  };

  // Handle Logout
  const handleLogout = () => {
    const newState = { isAuthenticated: false, username: '' };
    setAuth(newState);
    saveAuthState(newState);
  };

  // Delete Customer and their associated transactions safely
  const handleDeleteCustomer = (id: string) => {
    const freshCustomers = customers.filter(c => c.id !== id);
    const freshTransactions = transactions.filter(t => t.customerId !== id);
    setCustomers(freshCustomers);
    setTransactions(freshTransactions);
    saveCustomers(freshCustomers);
    saveTransactions(freshTransactions);
    if (selectedCustomerId === id) {
      setSelectedCustomerId(null);
    }
    setConfirmDeleteCustomerId(null);
  };

  // Add or Edit Customer callback
  const handleSaveCustomer = (
    customerData: Omit<Customer, 'id' | 'createdAt'>,
    initialBalance: { amount: number; type: TransactionType } | null
  ) => {
    if (editingCustomer) {
      // Editing Mode
      const updated = customers.map(c => 
        c.id === editingCustomer.id 
          ? { ...c, ...customerData } 
          : c
      );
      setCustomers(updated);
      saveCustomers(updated);
      setEditingCustomer(null);
    } else {
      // Adding Mode
      const newId = 'cust_' + Date.now();
      const newCustomer: Customer = {
        id: newId,
        ...customerData,
        createdAt: new Date().toISOString(),
      };

      const revisedCustomers = [...customers, newCustomer];
      setCustomers(revisedCustomers);
      saveCustomers(revisedCustomers);

      // Add auto initial balance transaction if requested
      if (initialBalance && initialBalance.amount > 0) {
        const initialTx: Transaction = {
          id: 'tx_init_' + Date.now(),
          customerId: newId,
          type: initialBalance.type,
          amount: initialBalance.amount,
          date: new Date().toISOString().split('T')[0],
          description: initialBalance.type === 'debit' 
            ? 'رصيد افتتاحي مقيد عند تسجيل العميل (مطلوب منه)'
            : 'دفعة رصيد افتتاحية مسددة مقدماً من العميل (له)',
          createdAt: new Date().toISOString()
        };
        const revisedTransactions = [...transactions, initialTx];
        setTransactions(revisedTransactions);
        saveTransactions(revisedTransactions);
      }
    }
  };

  // Add Transaction callback
  const handleSaveTransaction = (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      id: 'tx_' + Date.now(),
      ...transactionData,
      createdAt: new Date().toISOString()
    };
    const revisedTransactions = [...transactions, newTx];
    setTransactions(revisedTransactions);
    saveTransactions(revisedTransactions);
  };

  // Delete Transaction callback
  const handleDeleteTransaction = (txId: string) => {
    const revisedTransactions = transactions.filter(t => t.id !== txId);
    setTransactions(revisedTransactions);
    saveTransactions(revisedTransactions);
  };

  // Calculate current balances of each customer reactively
  const customerListWithBalances = useMemo(() => {
    return customers.map(customer => {
      const txs = transactions.filter(t => t.customerId === customer.id);
      const debits = txs.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
      const credits = txs.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
      const balance = debits - credits; // Positive means they owe us (debit), Negative means they have advance paid (credit)
      return {
        ...customer,
        balance,
        debits,
        credits,
        lastTransactionDate: txs.length > 0 ? txs.sort((a,b) => b.date.localeCompare(a.date))[0].date : ''
      };
    });
  }, [customers, transactions]);

  // Overall statistics for the Header widget
  const statisticsOverall = useMemo(() => {
    let debitOverall = 0;
    let creditOverall = 0;
    transactions.forEach(t => {
      if (t.type === 'debit') debitOverall += t.amount;
      else creditOverall += t.amount;
    });
    return {
      debitOverall,
      creditOverall
    };
  }, [transactions]);

  // Handle Search Filter for client cards
  const filteredCustomers = useMemo(() => {
    return customerListWithBalances.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [customerListWithBalances, searchTerm]);

  // Target Customer for Detailed Account Statement view
  const targetCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  if (!auth.isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none" dir="rtl">
      {/* Dynamic Header Component */}
      <Header 
        username={auth.username} 
        onLogout={handleLogout}
        totalCustomers={customers.length}
        totalDebitOverall={statisticsOverall.debitOverall}
        totalCreditOverall={statisticsOverall.creditOverall}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {targetCustomer ? (
            /* ================= VIEW 2: STATEMENT OF ACCOUNT (كشف حساب العميل) ================= */
            <motion.div
              key="statement"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CustomerStatement 
                customer={targetCustomer}
                transactions={transactions}
                onBack={() => setSelectedCustomerId(null)}
                onAddTransaction={() => setIsTransactionModalOpen(true)}
                onDeleteTransaction={handleDeleteTransaction}
              />
            </motion.div>
          ) : (
            /* ================= VIEW 1: DIRECTORY/CATALOG OF CLIENTS (قائمة العملاء والديون البسيطة) ================= */
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Directory search and Add Client controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-slate-800 text-lg">دفتر الحسابات والعملاء</h2>
                    <p className="text-xs text-slate-500 font-medium">اختر عميلاً لعرض كشف حسابه وطباعة المعاملات</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-grow sm:flex-none max-w-lg">
                  {/* Search Directory bar */}
                  <div className="relative flex-grow">
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="ابحث عن العميل بالاسم أو برقم الجوال..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pr-11 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-xs font-semibold text-slate-800"
                    />
                  </div>

                  {/* Add Customer Trigger button */}
                  <button
                    onClick={() => {
                      setEditingCustomer(null);
                      setIsCustomerModalOpen(true);
                    }}
                    className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm shadow-indigo-500/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة عميل جديد</span>
                  </button>
                </div>
              </div>

              {/* Grid of Client Cards */}
              {filteredCustomers.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center border border-slate-100 shadow-sm">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-200/60 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-7 h-7 text-slate-300" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">لا يوجد عملاء مسجلين حالياً</h3>
                  <p className="text-slate-400 text-xs mt-1.5 max-w-md mx-auto leading-relaxed">
                    ابدأ الآن بإضافة عملائك لتسجيل مبيعاتك بالآجل والدفعات النقدية ومتابعة تقارير كشوف الحساب فورا.
                  </p>
                  <button
                    onClick={() => {
                      setEditingCustomer(null);
                      setIsCustomerModalOpen(true);
                    }}
                    className="mt-6 py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>سجل أول عميل الآن</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCustomers.map((customer) => {
                    const balanceAbs = Math.abs(customer.balance);
                    return (
                      <motion.div
                        key={customer.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
                      >
                        {/* Card Upper Segment */}
                        <div className="p-5 space-y-4">
                          <div className="flex items-start justify-between gap-2.5">
                            <div>
                              <h3 
                                onClick={() => setSelectedCustomerId(customer.id)}
                                className="font-bold text-slate-800 hover:text-indigo-700 transition cursor-pointer text-base leading-snug"
                              >
                                {customer.name}
                              </h3>
                              <p className="text-[11px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-indigo-600" />
                                <span className="font-mono">{customer.phone}</span>
                              </p>
                            </div>
                            
                            {/* Simple Badge detailing general balance */}
                            <span className={`text-[10px] py-1 px-2.5 rounded-full font-bold select-none whitespace-nowrap shrink-0 ${
                              customer.balance > 0 
                                ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                                : customer.balance < 0 
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                  : 'bg-slate-100 text-slate-600'
                            }`}>
                              {customer.balance > 0 ? 'مطلوب منه' : customer.balance < 0 ? 'له زيادة' : 'متزن'}
                            </span>
                          </div>

                          {/* Quick details (Address, Notes) */}
                          <p className="text-slate-500 text-xs truncate">
                            {customer.address ? customer.address : 'العنوان غير مسجل'}
                          </p>

                          {/* Account calculation summaries */}
                          <div className="bg-slate-50/70 rounded-xl p-3 grid grid-cols-2 gap-3 border border-slate-100 font-mono text-xs font-semibold text-slate-600">
                            <div>
                              <p className="text-[9px] text-slate-400 font-bold mb-0.5">مبيعات/مدين (+)</p>
                              <span className="text-rose-600">
                                {customer.debits.toLocaleString('en-US')} ر.س
                              </span>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-400 font-bold mb-0.5">مدفوعات/دائن (-)</p>
                              <span className="text-emerald-600">
                                {customer.credits.toLocaleString('en-US')} ر.س
                              </span>
                            </div>
                          </div>

                          {/* Computed Net Balance */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100/60">
                            <span className="text-[10px] text-slate-400 font-bold">الرصيد المتبقي:</span>
                            <div className="flex items-baseline gap-1">
                              <span className={`text-md font-extrabold font-mono ${
                                customer.balance > 0 ? 'text-rose-600' : customer.balance < 0 ? 'text-emerald-600' : 'text-slate-500'
                              }`}>
                                {balanceAbs.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400">ريال</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Lower utility controls bar */}
                        <div className="bg-slate-50/80 p-3.5 px-4 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => setSelectedCustomerId(customer.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-sm shadow-indigo-100 transition flex items-center gap-1 cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>كشف الحساب</span>
                          </button>

                          {/* Secondary triggers */}
                          <div className="flex items-center gap-1.5">
                            {/* Edit Customer info */}
                            <button
                              onClick={() => {
                                setEditingCustomer(customer);
                                setIsCustomerModalOpen(true);
                              }}
                              className="p-1.5 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-700 border border-slate-100 rounded-lg transition sm:h-8 sm:w-8 flex items-center justify-center cursor-pointer"
                              title="تعديل بيانات العميل"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Safe Deletion trigger */}
                            {confirmDeleteCustomerId === customer.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteCustomer(customer.id)}
                                  className="bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-rose-700 transition cursor-pointer"
                                >
                                  احذف
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteCustomerId(null)}
                                  className="bg-slate-300 text-slate-700 text-[10px] font-bold px-2 py-1 rounded hover:bg-slate-400 transition cursor-pointer"
                                >
                                  لأ
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteCustomerId(customer.id)}
                                className="p-1.5 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-400 border border-slate-100 rounded-lg transition sm:h-8 sm:w-8 flex items-center justify-center cursor-pointer"
                                title="حذف العميل وحساباته"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer system details */}
      <footer className="bg-white border-t border-slate-200/80 py-5 text-center mt-12 bg-slate-50" dir="rtl">
        <p className="text-xs text-slate-400 font-medium leading-relaxed">
          نظام مالي لإدارة الديون البسيطة والميزانية (مدين ودائن) • 2026
        </p>
        <p className="text-[10px] text-slate-400 mt-1">مصمم خصيصاً للتنقل السريع وحفظ السجلات بكل أمان وسهولة بموجب القوانين الحسابية والمالية.</p>
      </footer>

      {/* MODAL 1: CUSTOMER FORM MODAL */}
      <AnimatePresence>
        {isCustomerModalOpen && (
          <CustomerModal 
            isOpen={isCustomerModalOpen}
            onClose={() => {
              setIsCustomerModalOpen(false);
              setEditingCustomer(null);
            }}
            onSave={handleSaveCustomer}
            customer={editingCustomer}
          />
        )}
      </AnimatePresence>

      {/* MODAL 2: TRANSACTION FORM MODAL */}
      <AnimatePresence>
        {isTransactionModalOpen && targetCustomer && (
          <TransactionModal 
            isOpen={isTransactionModalOpen}
            onClose={() => setIsTransactionModalOpen(false)}
            onSave={handleSaveTransaction}
            customer={targetCustomer}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
