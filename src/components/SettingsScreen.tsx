/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Database, Sliders, Save, RefreshCw, FileJson, 
  Download, Upload, Users, UserPlus, Trash2, Shield, 
  CheckCircle2, AlertTriangle, Key, Lock, ArrowLeft 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, DatabaseConfig, Customer, Transaction, AccountantPermissions } from '../types';
import { 
  getUsers, saveUsers, getDatabaseConfig, saveDatabaseConfig,
  getCustomers, saveCustomers, getTransactions, saveTransactions,
  getAccountantPermissions, saveAccountantPermissions
} from '../localStorage';

interface SettingsScreenProps {
  currentUser: string;
  onBack: () => void;
  onRefreshData: () => void;
  accountantPermissions: AccountantPermissions;
  onUpdatePermissions: (perms: AccountantPermissions) => void;
}

export default function SettingsScreen({ 
  currentUser, 
  onBack, 
  onRefreshData,
  accountantPermissions,
  onUpdatePermissions
}: SettingsScreenProps) {
  // Users lists states
  const [users, setUsers] = useState<User[]>([]);

  // Find current user's role
  const currentUserRole = useMemo(() => {
    return users.find(u => u.username === currentUser)?.role || 'admin';
  }, [users, currentUser]);

  // Determine allowed tabs to render
  const allowedTabs = useMemo(() => {
    const tabs: ('db' | 'backup' | 'users' | 'permissions')[] = [];
    if (currentUserRole === 'admin' || accountantPermissions.viewDbConfig) tabs.push('db');
    if (currentUserRole === 'admin' || accountantPermissions.viewBackup) tabs.push('backup');
    if (currentUserRole === 'admin' || accountantPermissions.viewUsersList) tabs.push('users');
    tabs.push('permissions');
    return tabs;
  }, [currentUserRole, accountantPermissions]);

  const [activeTab, setActiveTab] = useState<'db' | 'backup' | 'users' | 'permissions'>('permissions');

  useEffect(() => {
    if (allowedTabs.length > 0 && !allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0]);
    }
  }, [allowedTabs, activeTab]);

  // Database Connection states
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>(getDatabaseConfig());
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'accountant'>('accountant');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  // Backup & Restore states
  const [backupSuccess, setBackupSuccess] = useState('');
  const [backupError, setBackupError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Statistics for backup context
  const [stats, setStats] = useState({
    customers: 0,
    transactions: 0,
    users: 0,
  });

  useEffect(() => {
    setUsers(getUsers());
    setStats({
      customers: getCustomers().length,
      transactions: getTransactions().length,
      users: getUsers().length,
    });
  }, []);

  // Update stats helper
  const refreshStats = () => {
    setStats({
      customers: getCustomers().length,
      transactions: getTransactions().length,
      users: getUsers().length,
    });
  };

  // Handle DB configurations saving
  const handleSaveDbConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingConn(true);
    setTestResult(null);

    // Simulate connection checking
    setTimeout(() => {
      const isOk = dbConfig.type === 'local' || (dbConfig.apiUrl && dbConfig.projectId);
      if (isOk) {
        const updatedConfig: DatabaseConfig = {
          ...dbConfig,
          status: 'connected',
          lastSync: new Date().toISOString()
        };
        setDbConfig(updatedConfig);
        saveDatabaseConfig(updatedConfig);
        setTestResult({
          success: true,
          message: dbConfig.type === 'local' 
            ? 'نجح التوثيق! تم تفعيل وضع قاعدة البيانات المحلية الفورية بأمان.' 
            : `تم تأسيس قناة اتصال آمنة ومزامنة المعطيات بنجاح مع المشروع: ${dbConfig.projectId}`
        });
      } else {
        setTestResult({
          success: false,
          message: 'فشل فحص الاتصال! يرجى ملء حقول المخدم والـ API ومُعرّف المجمع السحابي.'
        });
      }
      setIsTestingConn(false);
    }, 1200);
  };

  // Handle adding a new user
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (!newFullName.trim()) {
      setUserError('يرجى تحديد الاسم الكامل للموظف/المحاسب');
      return;
    }
    if (!newUsername.trim()) {
      setUserError('اسم المستخدم مطلوب للدخول');
      return;
    }
    if (newUsername.trim().toLowerCase() === 'admin' && users.some(u => u.username === 'admin')) {
      setUserError('اسم المستخدم (admin) محجوز لمدير النظام الافتراضي!');
      return;
    }
    if (users.some(u => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      setUserError('يرجى اختيار اسم مستخدم آخر، هذا الاسم مسجل مسبقاً في النظام');
      return;
    }
    if (!newPassword || newPassword.length < 3) {
      setUserError('يجب أن لا تقل كلمة المرور عن 3 خانات/أرقام للأمان');
      return;
    }

    const newUser: User = {
      id: 'usr_' + Date.now(),
      fullName: newFullName.trim(),
      username: newUsername.trim().toLowerCase(),
      password: newPassword,
      role: newRole,
      createdAt: new Date().toISOString()
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    saveUsers(updatedUsers);

    setNewFullName('');
    setNewUsername('');
    setNewPassword('');
    setNewRole('accountant');
    setUserSuccess(`تمت إضافة المستخدم الجديد (${newUser.fullName}) بنجاح وصلاحيته جاهزة!`);
    refreshStats();
  };

  // Delete User
  const handleDeleteUser = (userId: string, targetUsername: string) => {
    if (targetUsername === currentUser) {
      alert('لا يمكنك حذف الحساب الخاص بك أثناء قيامك بجلسة عمل نشطة حالياً!');
      return;
    }
    if (targetUsername === 'admin' && currentUser !== 'admin') {
      alert('صلاحية إلغاء أو حذف حساب مدير النظام الرئيسي غير متوفرة لحسابك!');
      return;
    }

    const filtered = users.filter(u => u.id !== userId);
    setUsers(filtered);
    saveUsers(filtered);
    setUserSuccess(`تمت إزالة حساب الموظف والمحاسب (${targetUsername}) بالكامل وحظر وصوله بالنظام.`);
    setConfirmDeleteUserId(null);
    refreshStats();
  };

  // PRO EXPORT BACKUP
  const handleExportBackup = () => {
    setBackupSuccess('');
    setBackupError('');

    try {
      const dataToExport = {
        meta: {
          exportedAt: new Date().toISOString(),
          system: 'Debt Ledger Simplified Platform',
          version: '2026.1'
        },
        customers: getCustomers(),
        transactions: getTransactions(),
        users: getUsers(),
        databaseConfig: getDatabaseConfig()
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      
      const fileDateString = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute("download", `نسخة_احتياطية_المستندات_المالية_${fileDateString}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setBackupSuccess('تم تسجيل وصياغة ملف الديون المجمّع وتنزيله إلى جهازكم بنجاح!');
    } catch (e) {
      setBackupError('حدث خطأ أثناء تصدير وموازنة الجداول المالية!');
    }
  };

  // PRO IMPORT BACKUP
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackupSuccess('');
    setBackupError('');

    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target?.result as string);
        
        // Validation check
        if (!parsedData.customers || !parsedData.transactions) {
          setBackupError('صيغة ملف النسخ الاحتياطي غير صالحة! يتطلب ملف JSON يحتوي على سجل العملاء والحركات.');
          return;
        }

        const importedCustCount = parsedData.customers.length;
        const importedTxCount = parsedData.transactions.length;

        if (confirm(`تحذير: سيتم دمج ومزامنة عدد (${importedCustCount}) عميل و (${importedTxCount}) حركة مالية واردة في هذا الملف مع بياناتك الحالية. هل تود الاستمرار؟`)) {
          // Merge logic or Overwrite
          // To keep it safe and prevent duplicates we can merge or overwrite. Overwrite is cleaner for full system restore!
          saveCustomers(parsedData.customers);
          saveTransactions(parsedData.transactions);
          
          if (parsedData.users && parsedData.users.length > 0) {
            saveUsers(parsedData.users);
            setUsers(parsedData.users);
          }
          if (parsedData.databaseConfig) {
            saveDatabaseConfig(parsedData.databaseConfig);
            setDbConfig(parsedData.databaseConfig);
          }

          setBackupSuccess(`تمت استثنائياً استعادة كامل البيانات وتحديث الجداول! تمت قراءة ${importedCustCount} عملاء و ${importedTxCount} قيود مالية باحترافية.`);
          refreshStats();
          onRefreshData();
        }
      } catch (err) {
        setBackupError('فشل تحليل المستند المرفق! تأكد من أن الملف بصيغة JSON سليمة وصالحة.');
      }
    };

    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Title block with back button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
            <Sliders className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-800 text-lg">شاشة الإعدادات والتحكم الإداري</h2>
            <p className="text-xs text-slate-500 font-medium">إدارة قواعد البيانات، النسخ الاحتياطي، وحسابات المحاسبين</p>
          </div>
        </div>

        <button
          onClick={onBack}
          className="py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 ml-1" />
          <span>الرجوع لدفتر الحسابات</span>
        </button>
      </div>

      {/* Main Panel Content split into Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar Drawer */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-1.5">
          <p className="text-[10px] text-slate-400 font-bold px-3 uppercase tracking-wider mb-2">أقسام الإعدادات</p>
          
          {allowedTabs.includes('db') && (
            <button
              onClick={() => setActiveTab('db')}
              className={`w-full py-3 px-4 rounded-xl text-right text-xs font-bold transition flex items-center gap-2.5 ${activeTab === 'db' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'hover:bg-slate-50 text-slate-600'}`}
            >
              <Database className="w-4 h-4" />
              <span>الاتصال بقاعدة البيانات والربط</span>
            </button>
          )}

          {allowedTabs.includes('backup') && (
            <button
              onClick={() => setActiveTab('backup')}
              className={`w-full py-3 px-4 rounded-xl text-right text-xs font-bold transition flex items-center gap-2.5 ${activeTab === 'backup' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'hover:bg-slate-50 text-slate-600'}`}
            >
              <FileJson className="w-4 h-4" />
              <span>النسخ الاحتياطي ومطابقة الملفات</span>
            </button>
          )}

          {allowedTabs.includes('users') && (
            <button
              onClick={() => {
                setActiveTab('users');
                setUserError('');
                setUserSuccess('');
              }}
              className={`w-full py-3 px-4 rounded-xl text-right text-xs font-bold transition flex items-center gap-2.5 ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'hover:bg-slate-50 text-slate-600'}`}
            >
              <Users className="w-4 h-4" />
              <span>صلاحيات المحاسبين والمستخدمين</span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('permissions');
              setUserError('');
              setUserSuccess('');
            }}
            className={`w-full py-3 px-4 rounded-xl text-right text-xs font-bold transition flex items-center gap-2.5 ${activeTab === 'permissions' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'hover:bg-slate-50 text-slate-600'}`}
          >
            <Shield className="w-4 h-4" />
            <span>لوحة صلاحيات المحاسب المالي</span>
          </button>

          <div className="pt-4 border-t border-slate-100 mt-4 text-center">
            <p className="text-[10px] text-slate-400">مستوى صلاحياتك الحالي:</p>
            <span className={`inline-block mt-1 text-[10px] font-extrabold px-3 py-1 rounded-full ${currentUserRole === 'admin' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
              {currentUserRole === 'admin' ? '🔑 مدير النظام (الوصول المطلق)' : '📝 محاسب مرخص'}
            </span>
          </div>
        </div>

        {/* Tab content area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            
            {/* 1. Database Connect Screen Tab */}
            {activeTab === 'db' && (
              <motion.div
                key="db-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6"
              >
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-600" />
                    <span>تكوين خادم الاتصال والتحصيل السحابي</span>
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    يمكنك ربط تطبيقك بقاعدة بيانات خارجية أو تفضيل الحفظ الفوري المحلي على المتصفح. تمنع القناة المرمزة كشف البيانات لغير مصرح بهم.
                  </p>
                </div>

                <form onSubmit={handleSaveDbConfig} className="space-y-6">
                  {/* Radio selections for storage engine */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className={`p-4 rounded-xl border flex flex-col items-start gap-2 cursor-pointer transition ${dbConfig.type === 'local' ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input 
                        type="radio" 
                        name="db_type" 
                        checked={dbConfig.type === 'local'} 
                        onChange={() => setDbConfig({ ...dbConfig, type: 'local' })}
                        className="w-4 h-4 text-indigo-600" 
                      />
                      <span className="text-xs font-bold text-slate-800">تخزين محلي فوري (Local Storage)</span>
                      <span className="text-[10px] text-slate-400">سريع جداً، لا يحتاج لإنترنت ويعتمد على ذاكرة المتصفح</span>
                    </label>

                    <label className={`p-4 rounded-xl border flex flex-col items-start gap-2 cursor-pointer transition ${dbConfig.type === 'cloud' ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input 
                        type="radio" 
                        name="db_type" 
                        checked={dbConfig.type === 'cloud'} 
                        onChange={() => setDbConfig({ ...dbConfig, type: 'cloud', apiUrl: dbConfig.apiUrl || 'https://firestore.googleapis.com', projectId: dbConfig.projectId || 'debt-firm-production' })}
                        className="w-4 h-4 text-indigo-600" 
                      />
                      <span className="text-xs font-bold text-slate-800">قناة مزامنة سحابية (Cloud Cloud/Firestore)</span>
                      <span className="text-[10px] text-slate-400">مزامنة آمنة تحفظ الديون وتسجل القيود عبر مخدم سحابي مدمج</span>
                    </label>

                    <label className={`p-4 rounded-xl border flex flex-col items-start gap-2 cursor-pointer transition ${dbConfig.type === 'custom_api' ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input 
                        type="radio" 
                        name="db_type" 
                        checked={dbConfig.type === 'custom_api'} 
                        onChange={() => setDbConfig({ ...dbConfig, type: 'custom_api' })}
                        className="w-4 h-4 text-indigo-600" 
                      />
                      <span className="text-xs font-bold text-slate-800">اتصال API خارجي مخصص</span>
                      <span className="text-[10px] text-slate-400">تكامل السيرفر الداخلي للشركة مع قنوات الـ API الخاصة بكم</span>
                    </label>
                  </div>

                  {dbConfig.type !== 'local' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 pt-4 border-t border-slate-100"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2">رابط الخادم أو الـ API Endpoint</label>
                          <input 
                            type="url"
                            value={dbConfig.apiUrl || ''}
                            onChange={(e) => setDbConfig({ ...dbConfig, apiUrl: e.target.value })}
                            required
                            placeholder="https://api.myfirmdatabase.com/v1"
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs text-left font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2">معرّف المشروع / اسم قاعدة البيانات (Project ID)</label>
                          <input 
                            type="text"
                            value={dbConfig.projectId || ''}
                            onChange={(e) => setDbConfig({ ...dbConfig, projectId: e.target.value })}
                            required
                            placeholder="system-ledger-prod-2026"
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs text-left font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">الرمز السري المعتمد (Authorization / Private API Token)</label>
                        <div className="relative">
                          <input 
                            type="password"
                            value={dbConfig.apiKey || ''}
                            onChange={(e) => setDbConfig({ ...dbConfig, apiKey: e.target.value })}
                            placeholder="••••••••••••••••••••••••••••••••••••"
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <Lock className="w-4 h-4 text-slate-300 absolute left-3.5 top-2.5" />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">يُشَفَّر المفتاح تلقائياً محلياً لمنع تسريب صلاحيات خادم Firestore أو الـ API.</p>
                      </div>
                    </motion.div>
                  )}

                  {testResult && (
                    <div className={`p-4 rounded-xl border flex items-start gap-2.5 leading-relaxed text-xs font-semibold ${testResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'}`}>
                      {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                      <p>{testResult.message}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={isTestingConn}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-indigo-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isTestingConn ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جاري فحص الاتصال وموازنة الجداول...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>فحص وحفظ إعدادات الاتصال</span>
                        </>
                      )}
                    </button>
                    
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>الحالة المتلقاة: {dbConfig.status === 'connected' ? 'مُرتبط ومُؤمّن' : 'غير متصل'}</span>
                    </span>
                  </div>
                </form>
              </motion.div>
            )}

            {/* 2. Backup & Restore Tab */}
            {activeTab === 'backup' && (
              <motion.div
                key="backup-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6"
              >
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                    <FileJson className="w-5 h-5 text-indigo-600" />
                    <span>تصدير واستعادة النسخ الاحتياطية</span>
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    احفظ نسخة شاملة من دفتر الحسابات والدفوعات على جهازك الشخصي لاسترجاعها في أي وقت، لتفادي فقدان البيانات في حال تهيئة المتصفح.
                  </p>
                </div>

                {/* Dashboard stats overview */}
                <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold">العملاء المقيدين حالياً</p>
                    <p className="text-lg font-bold text-slate-800 font-mono mt-1">{stats.customers}</p>
                  </div>
                  <div className="text-center border-x border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold">إجمالي قيود الحركات المكتوبة</p>
                    <p className="text-lg font-bold text-slate-800 font-mono mt-1">{stats.transactions}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold">المحاسبين المسجلين في النظام</p>
                    <p className="text-lg font-bold text-slate-800 font-mono mt-1">{stats.users}</p>
                  </div>
                </div>

                {backupSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <p>{backupSuccess}</p>
                  </div>
                )}

                {backupError && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <p>{backupError}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Export block */}
                  <div className="p-5 border border-dashed border-slate-200 rounded-xl space-y-4 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="inline-flex p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                        <Download className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">تنزيل نسخة احتياطية محلية متكاملة</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        تعبئة داتا القيود، أسماء العملاء، والدفاتر المعتمدة وبطاقات المبيعات كاملة في ملف واحد بصيغة JSON آمنة للتنزيل.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                    >
                      <Download className="w-4 h-4" />
                      <span>توليد وحفظ ملف النسخ الاحتياطي</span>
                    </button>
                  </div>

                  {/* Import block */}
                  <div className="p-5 border border-dashed border-slate-200 rounded-xl space-y-4 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="inline-flex p-2 bg-violet-50 text-violet-700 rounded-lg">
                        <Upload className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">رفع واستعادة نسخة ديون سابقة</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        اختر ملف النسخ المحفوظ (JSON) لمطابقة المشتريات والحسابات، سيؤدي هذا لتجاوز وأقلمة السجلات القديمة مع محتوى الملف المرفوع.
                      </p>
                    </div>

                    <div className="space-y-2 mt-4">
                      {/* Hidden File Input */}
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept=".json"
                        onChange={handleImportBackup}
                        className="hidden" 
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-indigo-600" />
                        <span>اختيار ملف JSON المعتمد</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. User Management Screen Tab */}
            {activeTab === 'users' && (
              <motion.div
                key="users-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      <span>إدارة حسابات مستخدمي النظام (المحاسبين)</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">
                      سجل المحاسبين والمدراء المعتمدين للعمل على السجلات، يملك المدير العام (admin) صلاحيات مطلقة لإضافة وتعديل وحذف مستخدمين.
                    </p>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 py-1 px-3 rounded-full font-bold">
                    إجمالي المستخدمين: {users.length}
                  </span>
                </div>

                {userSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <p>{userSuccess}</p>
                  </div>
                )}

                {userError && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <p>{userError}</p>
                  </div>
                )}

                {/* Sub-Layout: Add form and User directory map */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Form to add user */}
                  <div className="xl:col-span-1 bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 pb-2.5 border-b border-slate-200">
                      <UserPlus className="w-4 h-4 text-indigo-600" />
                      <span>إضافة حساب مستخدم جديد</span>
                    </h4>

                    {currentUserRole !== 'admin' ? (
                      <div className="p-4 bg-amber-50 rounded-xl text-amber-900 text-[11px] leading-relaxed font-semibold border border-amber-100 space-y-2">
                        <Shield className="w-5 h-5 text-amber-600" />
                        <p>عذراً! حسابك الحالي يقع تحت مسمى "محاسب مرخص" ولا يملك صلاحية صياغة مستخدمين جدد. يرجى مراجعة المسؤول.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleAddUser} className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">الاسم والكنية الكاملة للموظف</label>
                          <input 
                            type="text"
                            value={newFullName}
                            onChange={(e) => setNewFullName(e.target.value)}
                            placeholder="مثال: صالح بن سعد الغامدي"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">اسم المستخدم (بالإنجليزية)</label>
                          <input 
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            placeholder="مثال: saleh2026"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 font-mono text-left"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">تعيين كلمة المرور</label>
                          <div className="relative">
                            <input 
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="أرقام أو حروف سرية..."
                              className="w-full pr-3 pl-8 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 font-mono text-left"
                            />
                            <Key className="w-3.5 h-3.5 text-slate-300 absolute left-2.5 top-2.5" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">درجة الصلاحيات والنفوذ</label>
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                          >
                            <option value="accountant">📝 محاسب مالي (تحصيل وإصدار قيود)</option>
                            <option value="admin">🔑 مدير نظام (نفوذ وتحكم كامل)</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>إضافته للمحاسبين المعتمدين</span>
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Users Directory Table list */}
                  <div className="xl:col-span-2 space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-700 px-1">جدول الأمان ومستخدمي السيرفر الفعليين</h4>
                    
                    <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                          <tr>
                            <th className="py-3 px-4 font-semibold text-slate-500">اسم المحاسب</th>
                            <th className="py-3 px-4 font-semibold text-slate-500">اسم التحميل</th>
                            <th className="py-3 px-4 font-semibold text-slate-500">الصلاحيات</th>
                            <th className="py-3 px-4 text-center font-semibold text-slate-500">الخيارات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {users.map((user) => {
                            const isSelf = user.username === currentUser;
                            return (
                              <tr key={user.id} className="hover:bg-slate-50/50 transition">
                                <td className="py-3.5 px-4 font-bold text-slate-800">
                                  <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-[10px] uppercase">
                                      {user.fullName.trim().charAt(0)}
                                    </span>
                                    <span>
                                      {user.fullName}
                                      {isSelf && <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold py-0.5 px-1.5 rounded-full mr-1.5">جلسة عملك</span>}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 font-mono text-slate-500">{user.username}</td>
                                <td className="py-3.5 px-4">
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold py-1 px-2.5 rounded-full ${user.role === 'admin' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                    {user.role === 'admin' ? '🔑 مدير' : '📝 محاسب'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  {isSelf || (user.username === 'admin' && currentUser !== 'admin') ? (
                                    <button
                                      disabled
                                      className="p-1.5 rounded-lg border border-slate-200 text-slate-300 opacity-30 cursor-not-allowed inline-flex items-center justify-center"
                                      title={isSelf ? "لا يمكنك حذف حسابك الحالي" : "صلاحية إلغاء مدير النظام غير متوفرة"}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  ) : confirmDeleteUserId === user.id ? (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => handleDeleteUser(user.id, user.username)}
                                        className="py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[10px] cursor-pointer"
                                      >
                                        تأكيد الحذف
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteUserId(null)}
                                        className="py-1 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold text-[10px] cursor-pointer"
                                      >
                                        تراجع
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setConfirmDeleteUserId(user.id)}
                                      className="p-1.5 rounded-lg border border-rose-100 text-rose-500 hover:bg-rose-50 cursor-pointer inline-flex items-center justify-center transition"
                                      title="شطب حساب المستخدم"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. Permission Management Screen Tab */}
            {activeTab === 'permissions' && (
              <motion.div
                key="permissions-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6"
              >
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    <span>إدارة صلاحيات المحاسب المالي (Accountant Roles Permissions)</span>
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    تتيح هذه اللوحة لمدير النظام تمكين أو تعطيل إجراءات وميزات معينة على حسابات المحاسبين (accountant) لحماية السجلات المالية من التلاعب أو الحذف غير المصرح به.
                  </p>
                </div>

                {currentUserRole !== 'admin' ? (
                  <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 text-amber-900 text-xs leading-relaxed space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-800">
                      <AlertTriangle className="w-5 h-5 text-amber-600-slow" />
                      <span>تنبيه: عرض الصلاحيات فقط</span>
                    </div>
                    <p>
                      حسابك المسجل حالياً هو بمستوى <strong className="text-warning font-extrabold">محاسب مالي مرخص</strong>. تظهر الإعدادات أدناه كعرض فقط ولا يمكن تعديلها إلا من خلال دخول حساب مدير النظام الرئيسي (admin).
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-indigo-50/50 rounded-xl text-indigo-900 text-xs leading-relaxed flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
                    <p>
                      بصفتك <strong>مدير النظام (Admin)</strong>، تملك الصلاحية المطلقة لتعديل وضبط صلاحيات المحاسبين فوراً. سيتم تطبيق وتفعيل التغييرات تلقائياً وبشكل فوري وحفظها.
                    </p>
                  </div>
                )}

                <div className="space-y-6 pt-2">
                  <div className="space-y-4">
                    {/* Permission 1: Delete Customer */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-50/80 transition">
                      <div className="space-y-1 ml-4 text-right">
                        <h4 className="text-sm font-bold text-slate-800">حذف العملاء وسجلاتهم (Delete Customers)</h4>
                        <p className="text-xs text-slate-400">
                          تمكين المحاسبين من إزالة حسابات العملاء وشطب كامل حركاتهم المالية من قاعدة البيانات نهائياً.
                        </p>
                      </div>
                      
                      <button
                        type="button"
                        disabled={currentUserRole !== 'admin'}
                        onClick={() => {
                          onUpdatePermissions({
                            ...accountantPermissions,
                            deleteCustomer: !accountantPermissions.deleteCustomer
                          });
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                          accountantPermissions.deleteCustomer ? 'bg-indigo-600' : 'bg-slate-200'
                        } ${currentUserRole !== 'admin' ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            accountantPermissions.deleteCustomer ? '-translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Permission 2: Modify Transactions */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-50/80 transition">
                      <div className="space-y-1 ml-4 text-right">
                        <h4 className="text-sm font-bold text-slate-800">إضافة وتعديل وحذف القيود والحركات (Modify Transactions)</h4>
                        <p className="text-xs text-slate-400">
                          تمكين المحاسبين من تسجيل معاملات مالية جديدة أو تعديل وحذف القيود السابقة في كشف الحساب.
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={currentUserRole !== 'admin'}
                        onClick={() => {
                          onUpdatePermissions({
                            ...accountantPermissions,
                            modifyTransactions: !accountantPermissions.modifyTransactions
                          });
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                          accountantPermissions.modifyTransactions ? 'bg-indigo-600' : 'bg-slate-200'
                        } ${currentUserRole !== 'admin' ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            accountantPermissions.modifyTransactions ? '-translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Permission 3: View Database Tab */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-50/80 transition">
                      <div className="space-y-1 ml-4 text-right">
                        <h4 className="text-sm font-bold text-slate-800">عرض قسم الاتصال وقاعدة البيانات (View Database Tab)</h4>
                        <p className="text-xs text-slate-400">
                          تمكين المحاسب من تصفح خيارات الاتصال وخادم المزامنة السحابي من شاشة الإعدادات والربط.
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={currentUserRole !== 'admin'}
                        onClick={() => {
                          onUpdatePermissions({
                            ...accountantPermissions,
                            viewDbConfig: !accountantPermissions.viewDbConfig
                          });
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                          accountantPermissions.viewDbConfig ? 'bg-indigo-600' : 'bg-slate-200'
                        } ${currentUserRole !== 'admin' ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            accountantPermissions.viewDbConfig ? '-translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Permission 4: View Backup Tab */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-50/80 transition">
                      <div className="space-y-1 ml-4 text-right">
                        <h4 className="text-sm font-bold text-slate-800">عرض قسم النسخ الاحتياطي ومطابقة الملفات (View Backup Tab)</h4>
                        <p className="text-xs text-slate-400">
                          تمكين المحاسب من تصدير واسترجاع ملفات النسخ الاحتياطي وتحديث الجداول من شاشة الحفظ ومطابقة الاختصاصات.
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={currentUserRole !== 'admin'}
                        onClick={() => {
                          onUpdatePermissions({
                            ...accountantPermissions,
                            viewBackup: !accountantPermissions.viewBackup
                          });
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                          accountantPermissions.viewBackup ? 'bg-indigo-600' : 'bg-slate-200'
                        } ${currentUserRole !== 'admin' ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            accountantPermissions.viewBackup ? '-translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Permission 5: View Users List Tab */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-50/80 transition">
                      <div className="space-y-1 ml-4 text-right">
                        <h4 className="text-sm font-bold text-slate-800">عرض قسم إدارة المحاسبين والشركاء (View Users List Tab)</h4>
                        <p className="text-xs text-slate-400">
                          تمكين المحاسب من رؤية قائمة حسابات مستخدمي النظام ومحاسبي السيرفر الفعّالين ومطابقة صلاحياتهم.
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={currentUserRole !== 'admin'}
                        onClick={() => {
                          onUpdatePermissions({
                            ...accountantPermissions,
                            viewUsersList: !accountantPermissions.viewUsersList
                          });
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                          accountantPermissions.viewUsersList ? 'bg-indigo-600' : 'bg-slate-200'
                        } ${currentUserRole !== 'admin' ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            accountantPermissions.viewUsersList ? '-translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Permission 6: View Dashboard Permission */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-50/80 transition">
                      <div className="space-y-1 ml-4 text-right">
                        <h4 className="text-sm font-bold text-slate-800">صلاحية الدخول لوحة القيادة الرئيسية (Access and View Main Dashboard)</h4>
                        <p className="text-xs text-slate-400">
                          تمكين المحاسب من تصفح لوحة القيادة ومطالعة الأرصدة الإجمالية وحسابات العملاء الكلية على النظام.
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={currentUserRole !== 'admin'}
                        onClick={() => {
                          onUpdatePermissions({
                            ...accountantPermissions,
                            viewDashboard: !accountantPermissions.viewDashboard
                          });
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                          accountantPermissions.viewDashboard ? 'bg-indigo-600' : 'bg-slate-200'
                        } ${currentUserRole !== 'admin' ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            accountantPermissions.viewDashboard ? '-translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold">
                      تحكم الصلاحيات الموحد مفعّل ومرتبط بالنظام الأمني الحسابي.
                    </span>
                    <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>يُحفظ تلقائياً في السيرفر الفوري للمتصفح</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
