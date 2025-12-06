import React, { useEffect, useState } from 'react';
import { LogOut, Users, FileText, BookOpen, ArrowLeft, CheckCircle, XCircle, Globe, MapPin } from 'lucide-react';
import { getInvoices, getSites, getEmployees, getSharedAttendanceData } from '../services/mockData';
import { Invoice, Site, Employee, AttendanceRecord } from '../types';

// --- Translations ---
const TRANSLATIONS = {
  en: {
    welcome: "Welcome",
    attendance: "Attendance",
    bills: "Bills / Money",
    ledger: "Ledger / Khata",
    unpaid: "Pending Payment",
    paid: "Received",
    total: "Total",
    workers: "Workers",
    present: "Present",
    sites: "Sites",
    back: "Back",
    logout: "Logout",
    loading: "Loading...",
    noData: "No Data",
    rupees: "₹"
  },
  hi: {
    welcome: "नमस्ते",
    attendance: "हाजिरी (Attendance)",
    bills: "बिल / पैसा (Bills)",
    ledger: "खाता (Ledger)",
    unpaid: "बाकी पैसा (Pending)",
    paid: "जमा हुआ (Received)",
    total: "कुल",
    workers: "कामगार",
    present: "उपस्थित",
    sites: "साइट्स",
    back: "पीछे",
    logout: "बाहर निकलें",
    loading: "लोड हो रहा है...",
    noData: "कोई डेटा नहीं",
    rupees: "₹"
  }
};

interface BossScreenProps {
  onLogout: () => void;
  user?: any;
}

const BossScreen: React.FC<BossScreenProps> = ({ onLogout, user }) => {
  const [lang, setLang] = useState<'en' | 'hi'>('hi'); // Default to Hindi
  const t = TRANSLATIONS[lang];
  const [view, setView] = useState<'home' | 'attendance' | 'bills' | 'ledger'>('home');

  // Data State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const loadData = async () => {
        setInvoices(await getInvoices());
        setSites(await getSites());
        setEmployees(await getEmployees());
        setAttendance(await getSharedAttendanceData());
    };
    loadData();
    const interval = setInterval(loadData, 60000); // Auto-refresh every 60s
    return () => clearInterval(interval);
  }, []);

  // --- Helper Components ---
  
  const BigButton = ({ icon: Icon, label, color, onClick }: any) => (
    <button 
      onClick={onClick}
      className={`w-full p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-4 transition-transform active:scale-95 ${color}`}
    >
      <div className="bg-white/20 p-4 rounded-full">
        <Icon size={48} className="text-white" />
      </div>
      <span className="text-white text-xl font-bold text-center">{label}</span>
    </button>
  );

  const StatRow = ({ label, value, isMoney = false, color = "text-gray-800" }: any) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 font-medium text-lg">{label}</span>
      <span className={`text-xl font-bold ${color}`}>
        {isMoney ? t.rupees : ''}{value}
      </span>
    </div>
  );

  // --- Views ---

  const HomeView = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
      {/* Header Card */}
      <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users size={120} />
        </div>
        <h1 className="text-3xl font-bold mb-1">{t.welcome}, {user?.name || 'Boss'}</h1>
        <p className="opacity-80 text-lg">{new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        
        <button 
            onClick={() => setLang(prev => prev === 'en' ? 'hi' : 'en')}
            className="mt-4 bg-white/20 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold backdrop-blur-sm"
        >
            <Globe size={16} />
            {lang === 'en' ? 'हिंदी में देखें' : 'Switch to English'}
        </button>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 gap-4">
        <BigButton 
            icon={Users} 
            label={t.attendance} 
            color="bg-blue-500" 
            onClick={() => setView('attendance')} 
        />
        <BigButton 
            icon={FileText} 
            label={t.bills} 
            color="bg-green-600" 
            onClick={() => setView('bills')} 
        />
        <BigButton 
            icon={BookOpen} 
            label={t.ledger} 
            color="bg-orange-500" 
            onClick={() => setView('ledger')} 
        />
      </div>

      <button onClick={onLogout} className="w-full py-4 text-red-500 font-bold flex items-center justify-center gap-2 mt-8 bg-white rounded-xl shadow-sm">
        <LogOut size={20} /> {t.logout}
      </button>
    </div>
  );

  const AttendanceView = () => {
    // Group attendance by site
    const today = new Date().toISOString().split('T')[0];
    const siteStats = sites.map(site => {
        const siteEmps = employees.filter(e => e.siteId === site.id);
        const presentCount = siteEmps.filter(e => {
            const record = attendance.find(r => r.employeeId === e.id && r.date === today);
            return record?.status === 'P';
        }).length;
        return { ...site, total: siteEmps.length, present: presentCount };
    });

    const totalWorkers = employees.length;
    const totalPresent = siteStats.reduce((sum, s) => sum + s.present, 0);

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="bg-blue-500 p-6 text-white rounded-b-3xl shadow-md sticky top-0 z-10">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => setView('home')} className="bg-white/20 p-2 rounded-full"><ArrowLeft /></button>
                    <h2 className="text-2xl font-bold">{t.attendance}</h2>
                </div>
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-blue-100 text-lg">{t.total} {t.workers}</p>
                        <p className="text-4xl font-bold">{totalPresent} <span className="text-xl opacity-60">/ {totalWorkers}</span></p>
                    </div>
                    <div className="bg-white/20 px-4 py-2 rounded-lg">
                        <span className="text-xl font-bold">{Math.round((totalPresent/totalWorkers)*100 || 0)}%</span>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto pb-20">
                {siteStats.map(site => (
                    <div key={site.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-gray-800 text-lg">{site.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${site.present > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {site.present} / {site.total}
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                            <div 
                                className="bg-blue-500 h-full rounded-full transition-all duration-1000" 
                                style={{ width: `${(site.present / site.total) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const BillsView = () => {
    const unpaidInvoices = invoices.filter(i => i.status === 'Unpaid');
    const totalUnpaid = unpaidInvoices.reduce((sum, i) => sum + i.amount, 0);

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="bg-green-600 p-6 text-white rounded-b-3xl shadow-md sticky top-0 z-10">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => setView('home')} className="bg-white/20 p-2 rounded-full"><ArrowLeft /></button>
                    <h2 className="text-2xl font-bold">{t.bills}</h2>
                </div>
                <div>
                    <p className="text-green-100 text-lg">{t.unpaid}</p>
                    <p className="text-4xl font-bold">{t.rupees} {totalUnpaid.toLocaleString()}</p>
                </div>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto pb-20">
                {unpaidInvoices.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <CheckCircle size={64} className="mx-auto mb-4 text-green-500 opacity-50" />
                        <p className="text-xl">{t.noData}</p>
                    </div>
                ) : (
                    unpaidInvoices.map(inv => (
                        <div key={inv.id} className="bg-white p-5 rounded-2xl shadow-sm border-l-8 border-red-500 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">{inv.siteName}</h3>
                                <p className="text-gray-500">{inv.billingPeriod}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-bold text-red-600">{t.rupees}{inv.amount.toLocaleString()}</p>
                                <span className="text-xs font-bold text-red-400 uppercase">Pending</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
  };

  const LedgerView = () => (
    <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-orange-500 p-6 text-white rounded-b-3xl shadow-md sticky top-0 z-10">
            <div className="flex items-center gap-4 mb-4">
                <button onClick={() => setView('home')} className="bg-white/20 p-2 rounded-full"><ArrowLeft /></button>
                <h2 className="text-2xl font-bold">{t.ledger}</h2>
            </div>
            <p className="opacity-90">Simple Expense Tracker</p>
        </div>
        <div className="p-10 text-center text-gray-400">
            <BookOpen size={64} className="mx-auto mb-4 opacity-30" />
            <p>Coming Soon...</p>
        </div>
    </div>
  );

  return (
    <div className="h-[100dvh] w-full bg-gray-50 font-sans overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-hidden relative">
            {view === 'home' && <HomeView />}
            {view === 'attendance' && <AttendanceView />}
            {view === 'bills' && <BillsView />}
            {view === 'ledger' && <LedgerView />}
        </div>

        {/* Bottom Navigation Bar */}
        <div className="bg-white border-t border-gray-200 flex justify-around p-2 pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
            <button 
                onClick={() => setView('home')} 
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${view === 'home' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}
            >
                <Users size={24} />
                <span className="text-[10px] font-bold">Dashboard</span>
            </button>
            <button 
                onClick={() => setView('bills')} 
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${view === 'bills' ? 'text-green-600 bg-green-50' : 'text-gray-400'}`}
            >
                <FileText size={24} />
                <span className="text-[10px] font-bold">Invoices</span>
            </button>
            <button 
                onClick={() => setView('attendance')} 
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${view === 'attendance' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}
            >
                <Users size={24} />
                <span className="text-[10px] font-bold">Staff</span>
            </button>
            <button 
                onClick={() => setView('ledger')} 
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${view === 'ledger' ? 'text-orange-600 bg-orange-50' : 'text-gray-400'}`}
            >
                <BookOpen size={24} />
                <span className="text-[10px] font-bold">Ledger</span>
            </button>
        </div>
    </div>
  );
};

export default BossScreen;
