/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { Customer, Transaction, TransactionType } from '../types';
import { 
  ArrowLeft, Printer, Calendar, Search, Filter, Plus, 
  ArrowUpRight, ArrowDownLeft, Trash2, Mail, Phone, MapPin, 
  BookOpen, FileText, Download, CheckCircle2, ChevronDown, Lock
} from 'lucide-react';
import { motion } from 'motion/react';

interface CustomerStatementProps {
  customer: Customer;
  transactions: Transaction[];
  onBack: () => void;
  onAddTransaction: () => void;
  onDeleteTransaction: (id: string) => void;
  canModifyTransactions?: boolean;
}

export default function CustomerStatement({ 
  customer, 
  transactions, 
  onBack, 
  onAddTransaction,
  onDeleteTransaction,
  canModifyTransactions = true
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

  // Export full detailed statement of account as a printable, standalone HTML file
  const handleExportHTML = () => {
    const today = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedOverallBalance = Math.abs(totals.overallBalance).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const balanceStatusText = totals.overallBalance > 0 
      ? '🔴 مطلوب منه (مدين للشركة/متأخرات)' 
      : totals.overallBalance < 0 
        ? '🟢 دائن للشركة (له مبالغ فائضة ومسبقة الدفع)' 
        : '✔️ رصيد حساب متزن كلياً (0.00 ريال)';

    const balanceStatusClass = totals.overallBalance > 0 
      ? 'status-debit' 
      : totals.overallBalance < 0 
        ? 'status-credit' 
        : 'status-neutral';

    // Build ledger rows chronologically or matched filtered choices
    const rowsHtml = filteredTx.map((tx, index) => {
      const txRunningBalance = tx.runningBalance !== undefined ? Math.abs(tx.runningBalance).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
      const balanceSign = tx.runningBalance !== undefined ? (tx.runningBalance > 0 ? 'مدين (+)' : tx.runningBalance < 0 ? 'دائن (-)' : 'متزن') : '';
      
      return `
        <tr>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e1e8f0; font-size: 11px; text-align: center; color: #64748b; font-family: sans-serif;">${index + 1}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e1e8f0; font-size: 11px; font-weight: bold; font-family: monospace; text-align: center; color: #475569;">${tx.date}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e1e8f0; text-align: right; font-weight: 600; font-size: 11px; color: #1e293b; max-width: 320px;">${tx.description}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e1e8f0; text-align: center; font-size: 10px;">
            <span style="background-color: #f1f5f9; padding: 3px 8px; border-radius: 9999px; border: 1px solid #e2e8f0; font-weight: 700; color: #475569;">${tx.createdBy || 'تلقائي / الأدمن'}</span>
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e1e8f0; font-family: monospace; text-align: center; font-weight: 800; color: #ef4444; background: #fffcfc; font-size: 12px;">
            ${tx.type === 'debit' ? '+' + tx.amount.toLocaleString('ar-EG', { minimumFractionDigits: 2 }) : '—'}
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e1e8f0; font-family: monospace; text-align: center; font-weight: 800; color: #22c55e; background: #fcfdfc; font-size: 12px;">
            ${tx.type === 'credit' ? '-' + tx.amount.toLocaleString('ar-EG', { minimumFractionDigits: 2 }) : '—'}
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e1e8f0; font-family: monospace; text-align: center; font-weight: 800; color: #0f172a; background: #fafafa; font-size: 12px;">
            ${txRunningBalance} <span style="font-size: 9px; font-weight: bold; color: ${tx.runningBalance && tx.runningBalance > 0 ? '#ef4444' : tx.runningBalance && tx.runningBalance < 0 ? '#22c55e' : '#64748b'};">(${balanceSign})</span>
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>كشف حساب مالي - ${customer.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Cairo', "Segoe UI", Roboto, sans-serif;
      direction: rtl;
      text-align: right;
      background-color: #f1f5f9;
      color: #0f172a;
      margin: 0;
      padding: 30px 15px;
    }
    
    .invoice-card {
      max-width: 900px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
      padding: 40px;
      position: relative;
    }

    .no-print-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background-color: #4f46e5;
      color: #ffffff;
      border: none;
      padding: 12px 24px;
      font-size: 13px;
      font-weight: 800;
      border-radius: 10px;
      cursor: pointer;
      position: absolute;
      top: 40px;
      left: 40px;
      box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
      transition: all 0.2s;
      font-family: 'Cairo', sans-serif;
    }

    .no-print-btn:hover {
      background-color: #4338ca;
      transform: translateY(-1px);
    }

    .header-logo {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 30px;
    }

    .logo-badge {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      background-color: #4f46e5;
      color: white;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      box-shadow: inset 0 -4px 0px rgba(0,0,0,0.15);
    }

    .company-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f171e;
      margin: 0;
    }

    .company-subtitle {
      font-size: 12px;
      color: #64748b;
      margin: 4px 0 0 0;
      font-weight: 500;
    }

    .report-title {
      text-align: center;
      font-size: 22px;
      font-weight: 800;
      color: #4f46e5;
      margin: 25px 0;
      padding-bottom: 12px;
      border-bottom: 3px double #e2e8f0;
    }

    .grid-info {
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 25px;
      margin-bottom: 30px;
    }

    .info-section {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 18px;
    }

    .section-headline {
      font-size: 13px;
      font-weight: 800;
      color: #4f46e5;
      margin: 0 0 12px 0;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 6px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 12px;
    }

    .info-row:last-child {
      margin-bottom: 0;
    }

    .info-row-label {
      color: #64748b;
      font-weight: 600;
    }

    .info-row-val {
      color: #0f172a;
      font-weight: 700;
    }

    .outstanding-panel {
      border-radius: 14px;
      padding: 18px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 30px 0;
      border: 1px solid #e2e8f0;
    }

    .outstanding-panel.status-debit {
      background-color: #fef2f2;
      border-color: #fecaca;
      color: #991b1b;
    }

    .outstanding-panel.status-credit {
      background-color: #f0fdf4;
      border-color: #bbf7d0;
      color: #166534;
    }

    .outstanding-panel.status-neutral {
      background-color: #f8fafc;
      border-color: #e2e8f0;
      color: #334155;
    }

    .outstanding-val {
      font-size: 24px;
      font-weight: 800;
      font-family: monospace, sans-serif;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }

    th {
      background-color: #f8fafc;
      color: #475569;
      font-size: 12px;
      font-weight: 800;
      padding: 14px 10px;
      border-bottom: 2px solid #cbd5e1;
    }

    tbody tr:nth-child(even) {
      background-color: #f8fafc;
    }

    tbody tr:hover {
      background-color: #f1f5f9;
    }

    .legal-disclaimer {
      margin-top: 45px;
      font-size: 11px;
      color: #64748b;
      line-height: 1.8;
      text-align: justify;
      background-color: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 10px;
      padding: 15px 20px;
    }

    .signature-area {
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 50px;
      margin-top: 60px;
      text-align: center;
    }

    .signature-box {
      border-top: 1px dashed #cbd5e1;
      padding-top: 12px;
      font-size: 13px;
      font-weight: bold;
      color: #334155;
    }

    .signature-title {
      font-size: 11px;
      color: #64748b;
      margin-top: 6px;
    }

    @media print {
      body {
        background-color: #ffffff;
        padding: 0;
      }
      
      .invoice-card {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
      
      .no-print-btn {
        display: none !important;
      }
      
      th {
        background-color: #f1f5f9 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>

  <div class="invoice-card">
    <button onclick="window.print()" class="no-print-btn">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" x2="18" y1="9" y2="9"/><line x1="6" x2="18" y1="13" y2="13"/><rect width="18" height="14" x="3" y="10" rx="2"/><path d="M6 10V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v6"/></svg>
      <span>طباعة التقرير الفورية / PDF</span>
    </button>

    <div class="header-logo">
      <div class="logo-badge">ن</div>
      <div>
        <h1 class="company-title">النظام المالي لإدارة الحسابات والمدفوعات</h1>
        <p class="company-subtitle">التقرير التفصيلي والحركات المسجلة للشركاء والعملاء</p>
      </div>
    </div>

    <div class="report-title">
      كشف كينونة وحساب مالي تفصيلي (Statement of Account)
    </div>

    <div class="grid-info">
      <div class="info-section">
        <h3 class="section-headline">بيانات الكشف والطباعة</h3>
        <div class="info-row">
          <span class="info-row-label">تاريخ تحرير التقرير:</span>
          <span class="info-row-val">${today}</span>
        </div>
        <div class="info-row">
          <span class="info-row-label">درجة الأمان والسرية:</span>
          <span class="info-row-val" style="color: #4f46e5; font-weight: 800;">وثيقة محاسبية مصدقة</span>
        </div>
        <div class="info-row">
          <span class="info-row-label font-bold">حالة الفلترة النشطة:</span>
          <span class="info-row-val font-semibold italic text-slate-500">${typeFilter === 'all' ? 'جميع المعاملات' : typeFilter === 'debit' ? 'مدين فقط (+)' : 'دائن فقط (-)'}</span>
        </div>
      </div>

      <div class="info-section">
        <h3 class="section-headline">بيانات الطرف المقابل (العميل)</h3>
        <div class="info-row">
          <span class="info-row-label">اسم العميل المسجل:</span>
          <span class="info-row-val" style="font-size: 13px; color: #4f46e5;">${customer.name}</span>
        </div>
        <div class="info-row">
          <span class="info-row-label">رقم الجوال النشط:</span>
          <span class="info-row-val" style="font-family: monospace; letter-spacing: 0.5px;">${customer.phone || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-row-label">عنوان السكن الإداري:</span>
          <span class="info-row-val">${customer.address || '—'}</span>
        </div>
      </div>
    </div>

    <div class="outstanding-panel ${balanceStatusClass}">
      <div>
        <span style="font-size: 12px; font-weight: 800; opacity: 0.85; display: block; margin-bottom: 4px;">الرصيد الإجمالي المطالب به (Outstanding Balance):</span>
        <strong style="font-size: 14px;">${balanceStatusText}</strong>
      </div>
      <div>
        <span class="outstanding-val">${formattedOverallBalance}</span>
        <span style="font-size: 12px; font-weight: 800; margin-right: 4px;">ريال</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 45px; text-align: center;">ت</th>
          <th style="width: 120px; text-align: center;">التاريخ</th>
          <th style="text-align: right;">البيان وتفاصيل المعاملة المالية</th>
          <th style="width: 130px; text-align: center;">المعلم المحاسبي</th>
          <th style="width: 110px; text-align: center;">مدين (+) [مطلوب]</th>
          <th style="width: 110px; text-align: center;">دائن (-) [مسدد]</th>
          <th style="width: 130px; text-align: center;">رصيد الحساب</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="7" style="padding: 24px; text-align: center; color: #94a3b8; font-weight: bold; font-size: 13px;">لا توجد معاملات تصفية متوافقة في السجل لعرضها حالياً.</td></tr>'}
      </tbody>
    </table>

    <div class="legal-disclaimer">
      <strong>مذكرة المراجعة والمطابقة المعتمدة:</strong> يُعتبر هذا التقرير المحاسبي بمثابة بيان رسمي نهائي بمجمل الحركات المالية والعمليات التجارية المتبادلة بين السجل المالي والعميل الموضح اسمه أعلاه. يُرجى التكرم بفحص ومراجعة كافة المعاملات والمدفوعات المدرجة ومطابقتها بالتفصيل. يعتبر الحساب مقراً به وموافقاً عليه تلقائياً ما لم يرد اعتراض رسمي خطّي موجه لإدارة الحسابات خلال (7) أيام عمل من تاريخ استخراج المستند. نشكر لكم حسن تعاونكم الدائم.
    </div>

    <div class="signature-area">
      <div class="signature-box">
        إقرار ومصادقة مستلم كشف الحساب (العميل)
        <div class="signature-title">الاسم والتوقيع: ......................................................</div>
      </div>
      <div class="signature-box">
        الاعتماد الحسابي والمالي للمؤسسة
        <div class="signature-title">الختم والمصادقة للمدير المالي</div>
      </div>
    </div>
  </div>

</body>
</html>`;

    // Download flow
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `تقرير_كشف_حساب_${customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            className="p-2.5 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 shadow-sm transition flex items-center gap-1.5 cursor-pointer text-sm font-semibold print:hidden"
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
          {!canModifyTransactions ? (
            <button
              disabled
              className="flex-grow sm:flex-none py-2.5 px-4 bg-slate-100 text-slate-400 border border-slate-200 font-bold rounded-xl text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-2"
              title="صلاحية إضافة المعاملات مقفلة للمحاسبين"
            >
              <Lock className="w-4 h-4 text-slate-450" />
              <span>تسجيل معاملة مالية (مغلق)</span>
            </button>
          ) : (
            <button
              onClick={onAddTransaction}
              className="flex-grow sm:flex-none py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-indigo-100 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل معاملة مالية</span>
            </button>
          )}
          
          <button
            onClick={handlePrint}
            className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer print:hidden"
            title="تحفيز طباعة الكشف المحلي"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span className="hidden xs:inline">طباعة الكشف</span>
          </button>

          <button
            onClick={handleExportHTML}
            className="py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 font-semibold rounded-xl text-xs sm:text-sm shadow-md shadow-indigo-100/30 transition flex items-center justify-center gap-1.5 cursor-pointer print:hidden"
            title="تنزيل تقرير مالي منسق بصيغة HTML جاهز للطباعة"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>تصدير تقرير HTML</span>
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
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4 print:hidden">
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
                  <th className="py-3.5 px-3 font-bold text-center w-32">الموظف المسؤول</th>
                  <th className="py-3.5 px-6 font-bold text-center w-28 bg-rose-500/[0.02]">مدين (+)</th>
                  <th className="py-3.5 px-6 font-bold text-center w-28 bg-emerald-500/[0.02]">دائن (-)</th>
                  <th className="py-3.5 px-6 font-bold text-center w-36 bg-slate-50 border-r border-slate-100">الرصيد المتبقي</th>
                  <th className="py-3.5 px-6 text-center w-20 print:hidden font-bold">خيارات</th>
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

                    {/* Created By User */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-650 text-[10px] font-extrabold border border-slate-200">
                        {tx.createdBy || 'تلقائي / المسؤول'}
                      </span>
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
                    <td className="py-3.5 px-6 text-center print:hidden">
                      {!canModifyTransactions ? (
                        <button
                          disabled
                          className="p-1 px-2.5 bg-slate-50 text-slate-350 rounded-lg border border-slate-100 cursor-not-allowed inline-flex items-center justify-center"
                          title="حذف القيود معطل للمحاسبين"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      ) : confirmDeleteId === tx.id ? (
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
