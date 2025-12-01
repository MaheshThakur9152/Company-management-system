import React, { useState, useEffect } from 'react';
import { Invoice, Site, ManualLedgerEntry, Employee, AttendanceRecord, SalaryRecord } from '../types';
import { Download, Filter, BookOpen, Plus, X, Edit2, Trash2, Briefcase, User, Building2, CheckCircle } from 'lucide-react';
import { generateLedgerExcel } from '../utils/excelGenerator';
import { generateLedgerPDF } from '../utils/pdfGenerator';
import { getManualLedgerEntries, addManualLedgerEntry, updateManualLedgerEntry, deleteManualLedgerEntry, getSalaryRecords } from '../services/mockData';

interface LedgerTabProps {
  invoices: Invoice[];
  sites: Site[];
  employees: Employee[];
  attendanceData: AttendanceRecord[];
  activeLedgerType?: LedgerType;
  userRole?: 'Admin' | 'SuperAdmin';
}

type LedgerType = 'client' | 'employee' | 'expense';

const LedgerTab: React.FC<LedgerTabProps> = ({
  invoices,
  sites,
  employees,
  attendanceData,
  activeLedgerType,
  userRole = 'Admin'
}) => {
  const [ledgerType, setLedgerType] = useState<LedgerType>(activeLedgerType || 'client');

  useEffect(() => {
    if (activeLedgerType) {
      setLedgerType(activeLedgerType);
    }
  }, [activeLedgerType]);
  
  // Selection States
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees.length > 0 ? employees[0].id : '');
  const [selectedExpenseHead, setSelectedExpenseHead] = useState<string>('Salaries');

  const [startDate, setStartDate] = useState<string>(`${new Date().getFullYear()}-04-01`); // Start of financial year
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [manualEntries, setManualEntries] = useState<ManualLedgerEntry[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New Entry State
  const [newEntry, setNewEntry] = useState<Partial<ManualLedgerEntry>>({
    date: new Date().toISOString().split('T')[0],
    particulars: '',
    vchType: 'Purchase',
    vchNo: '',
    debit: 0,
    credit: 0
  });

  useEffect(() => {
    const loadEntries = async () => {
      const entries = await getManualLedgerEntries();
      setManualEntries(entries);
      const records = await getSalaryRecords();
      setSalaryRecords(records);
    };
    loadEntries();
  }, []);

  // Ensure selection defaults are set when data loads
  useEffect(() => {
    // Default to 'all' for sites is already set in state init
  }, [sites]);

  useEffect(() => {
    if (!selectedEmployeeId && employees.length > 0) setSelectedEmployeeId(employees[0].id);
  }, [employees, selectedEmployeeId]);

  // Helper to get selected entity name
  const getEntityName = () => {
      if (ledgerType === 'client') {
          if (selectedSiteId === 'all') return 'Consolidated Client Ledger';
          return sites.find(s => s.id === selectedSiteId)?.name || 'Unknown Site';
      }
      if (ledgerType === 'employee') return employees.find(e => e.id === selectedEmployeeId)?.name || 'Unknown Employee';
      return selectedExpenseHead;
  };

  // --- TRANSACTION PROCESSING LOGIC ---
  let openingBalance = 0;
  const transactionsToShow: any[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (ledgerType === 'client') {
      // --- CLIENT LEDGER LOGIC (Existing) ---
      const allSiteInvoices = invoices.filter(inv => 
        (selectedSiteId === 'all' || inv.siteId === selectedSiteId) && !inv.invoiceNo.startsWith('PI')
      );
      const allSiteManualEntries = manualEntries.filter(entry => 
        (selectedSiteId === 'all' || entry.siteId === selectedSiteId)
      );

      // Process Invoices
      allSiteInvoices.forEach(inv => {
          const genDate = new Date(inv.generatedDate);
          // Debit (Generation)
          if (genDate < start) openingBalance += inv.amount;
          else if (genDate <= end) {
              transactionsToShow.push({
                  id: inv.id + '_gen', date: inv.generatedDate, particulars: `Bill Generated - ${inv.billingPeriod} (${inv.siteName})`,
                  vchType: 'Sales', vchNo: inv.invoiceNo, debit: inv.amount, credit: 0, isManual: false
              });
          }

          // Credit (Payment)
          if (inv.status === 'Paid') {
              let payDateStr = inv.paymentDate;
              if (!payDateStr) {
                  const d = new Date(inv.generatedDate);
                  d.setDate(d.getDate() + 1);
                  payDateStr = d.toISOString().split('T')[0];
              }
              const payDate = new Date(payDateStr);
              if (payDate < start) openingBalance -= inv.amount;
              else if (payDate <= end) {
                  transactionsToShow.push({
                      id: inv.id + '_pay', date: payDateStr, particulars: `Payment Received - ${inv.invoiceNo} (${inv.siteName})`,
                      vchType: 'Receipt', vchNo: '', debit: 0, credit: inv.amount, isManual: false
                  });
              }
          }
      });

      // Process Manual Entries
      allSiteManualEntries.forEach(entry => {
          const entryDate = new Date(entry.date);
          // Only approved entries affect opening balance
          if (entry.status === 'Pending' && entryDate < start) return;

          if (entryDate < start) openingBalance += (entry.debit - entry.credit);
          else if (entryDate <= end) {
              // Find site name for manual entry if 'all' is selected
              let siteNameSuffix = '';
              if (selectedSiteId === 'all') {
                  const s = sites.find(site => site.id === entry.siteId);
                  if (s) siteNameSuffix = ` (${s.name})`;
              }

              transactionsToShow.push({
                  id: entry.id, date: entry.date, particulars: entry.particulars + siteNameSuffix,
                  vchType: entry.vchType, vchNo: entry.vchNo, debit: entry.debit, credit: entry.credit, 
                  isManual: true, status: entry.status || 'Approved'
              });
          }
      });

  } else if (ledgerType === 'employee') {
      // --- EMPLOYEE LEDGER LOGIC ---
      // Credit: Salary Due (Payable)
      // Debit: Payments Made, Advances, Deductions
      
      const emp = employees.find(e => e.id === selectedEmployeeId);
      if (emp) {
          // 1. Manual Entries
          const empManualEntries = manualEntries.filter(entry => entry.siteId === selectedEmployeeId);

          empManualEntries.forEach(entry => {
            const entryDate = new Date(entry.date);
            // Only approved entries affect opening balance
            if (entry.status === 'Pending' && entryDate < start) return;

            // For Employee: Credit is Payable (Salary), Debit is Paid (Cash/Bank)
            if (entryDate < start) openingBalance += (entry.credit - entry.debit);
            else if (entryDate <= end) {
                transactionsToShow.push({
                    id: entry.id, date: entry.date, particulars: entry.particulars,
                    vchType: entry.vchType, vchNo: entry.vchNo, debit: entry.debit, credit: entry.credit, 
                    isManual: true, status: entry.status || 'Approved'
                });
            }
          });

          // 2. Auto-generated Salary Entries from SalaryRecords
          const empSalaryRecords = salaryRecords.filter(r => r.employeeId === selectedEmployeeId);
          
          empSalaryRecords.forEach(record => {
              // A. Salary Due (Credit) - End of Month
              // Construct date: Last day of the month
              const dueDate = new Date(record.year, record.month, 0); // Day 0 is last day of prev month (so month is 1-based in Date constructor? No, month is 0-based)
              // record.month is 1-based (1=Jan). Date(year, monthIndex, 0).
              // So Date(2025, 1, 0) -> Jan 31 2025.
              // record.month=1 -> Jan. We want Jan 31.
              // Date(2025, 1, 0) is correct.
              
              const dueDateStr = dueDate.toISOString().split('T')[0];
              const monthName = dueDate.toLocaleString('default', { month: 'long' });
              
              if (dueDate < start) {
                  openingBalance += record.netSalary; // Credit increases liability
              } else if (dueDate <= end) {
                  transactionsToShow.push({
                      id: `sal_due_${record.id}`,
                      date: dueDateStr,
                      particulars: `Salary Due - ${monthName} ${record.year}`,
                      vchType: 'Journal',
                      vchNo: '',
                      debit: 0,
                      credit: record.netSalary,
                      isManual: false,
                      status: 'Approved'
                  });
              }

              // B. Salary Paid (Debit) - If status is Paid
              if (record.status === 'Paid') {
                  let payDateStr = record.paymentDate;
                  if (!payDateStr) {
                      // Default to 7th of next month if not recorded
                      const pd = new Date(record.year, record.month, 7);
                      payDateStr = pd.toISOString().split('T')[0];
                  }
                  const payDate = new Date(payDateStr);

                  if (payDate < start) {
                      openingBalance -= record.netSalary; // Debit decreases liability
                  } else if (payDate <= end) {
                      transactionsToShow.push({
                          id: `sal_paid_${record.id}`,
                          date: payDateStr,
                          particulars: `Salary Payment - ${monthName} ${record.year}`,
                          vchType: 'Payment',
                          vchNo: '',
                          debit: record.netSalary,
                          credit: 0,
                          isManual: false,
                          status: 'Approved'
                      });
                  }
              }
          });
      }

  } else {
      // --- EXPENSE LEDGER LOGIC ---
      // Debit: Expenses
      // Credit: Payments
      
      // Using siteId to store Expense Head Name for now
      const expenseEntries = manualEntries.filter(entry => entry.siteId === selectedExpenseHead);
      
      expenseEntries.forEach(entry => {
          const entryDate = new Date(entry.date);
          // Only approved entries affect opening balance
          if (entry.status === 'Pending' && entryDate < start) return;

          if (entryDate < start) openingBalance += (entry.debit - entry.credit);
          else if (entryDate <= end) {
              transactionsToShow.push({
                  id: entry.id, date: entry.date, particulars: entry.particulars,
                  vchType: entry.vchType, vchNo: entry.vchNo, debit: entry.debit, credit: entry.credit, 
                  isManual: true, status: entry.status || 'Approved'
              });
          }
      });
  }

  // Sort transactions
  transactionsToShow.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 4. Calculate Running Balance
  let runningBalance = openingBalance;
  const finalTransactions = transactionsToShow.map(t => {
      // Skip balance update for pending entries
      if (t.status === 'Pending') {
          return { ...t, balance: runningBalance };
      }

      // For Client (Asset): Dr + / Cr -
      // For Employee (Liability): Cr + / Dr -
      // For Expense (Expense): Dr + / Cr -
      
      if (ledgerType === 'employee') {
          runningBalance = runningBalance + t.credit - t.debit; // Liability logic
      } else {
          runningBalance = runningBalance + t.debit - t.credit; // Asset/Expense logic
      }
      return { ...t, balance: runningBalance };
  });

  const currentBal = runningBalance;

  const handleSaveEntry = async () => {
    // Determine ID based on ledger type
    let targetId = '';
    if (ledgerType === 'client') targetId = selectedSiteId;
    else if (ledgerType === 'employee') targetId = selectedEmployeeId;
    else targetId = selectedExpenseHead;

    if (!targetId) {
        alert("No Site/Employee selected. Please select one before adding a transaction.");
        return;
    }
    if (!newEntry.date || !newEntry.particulars) {
        alert("Please fill Date and Particulars.");
        return;
    }

    const entry: ManualLedgerEntry = {
        id: editingId || Date.now().toString(),
        siteId: targetId, // Overloaded field
        date: newEntry.date!,
        particulars: newEntry.particulars!,
        vchType: newEntry.vchType || 'Journal',
        vchNo: newEntry.vchNo || '',
        debit: Number(newEntry.debit) || 0,
        credit: Number(newEntry.credit) || 0,
        status: userRole === 'SuperAdmin' ? 'Approved' : 'Pending'
    };

    if (editingId) await updateManualLedgerEntry(entry);
    else {
        await addManualLedgerEntry(entry);
        if (userRole === 'Admin') alert("Entry submitted for approval.");
    }

    const entries = await getManualLedgerEntries();
    setManualEntries(entries);
    setShowAddModal(false);
    setEditingId(null);
    setNewEntry({
        date: new Date().toISOString().split('T')[0],
        particulars: '',
        vchType: 'Journal',
        vchNo: '',
        debit: 0,
        credit: 0
    });
  };

  const handleEdit = (txn: any) => {
      setEditingId(txn.id);
      setNewEntry({
          date: txn.date,
          particulars: txn.particulars,
          vchType: txn.vchType,
          vchNo: txn.vchNo,
          debit: txn.debit,
          credit: txn.credit
      });
      setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
      if (confirm('Are you sure you want to delete this entry?')) {
          await deleteManualLedgerEntry(id);
          const entries = await getManualLedgerEntries();
          setManualEntries(entries);
      }
  };

  const handleApproveEntry = async (entry: ManualLedgerEntry) => {
      if (confirm('Approve this transaction?')) {
          const updated = { ...entry, status: 'Approved' as const };
          await updateManualLedgerEntry(updated);
          const entries = await getManualLedgerEntries();
          setManualEntries(entries);
      }
  };

  const handleExport = async () => {
    let accountName = '';
    let companyName = 'AMBE SERVICE'; // Default

    if (ledgerType === 'client') {
        if (selectedSiteId === 'all') {
            accountName = 'Consolidated Client Ledger';
        } else {
            const site = sites.find(s => s.id === selectedSiteId);
            if (site) {
                accountName = site.name;
                const siteNameLower = site.name.toLowerCase();
                if (
                    siteNameLower.includes('ajmera') || 
                    siteNameLower.includes('minerva ho') || 
                    siteNameLower.includes('lift operator')
                ) {
                    companyName = 'AMBE SERVICE FACILITIES PRIVATE LIMITED';
                }
            }
        }
    } else if (ledgerType === 'employee') {
        const emp = employees.find(e => e.id === selectedEmployeeId);
        if (!emp) return;
        accountName = emp.name;
        companyName = 'AMBE SERVICE FACILITIES PRIVATE LIMITED';
    } else {
        accountName = selectedExpenseHead;
        companyName = 'AMBE SERVICE FACILITIES PRIVATE LIMITED';
    }

    try {
        await generateLedgerExcel({
            companyName: companyName,
            accountName: accountName,
            period: `${new Date(startDate).toLocaleDateString('en-GB')} to ${new Date(endDate).toLocaleDateString('en-GB')}`,
            transactions: finalTransactions
        });
    } catch (error) {
        console.error("Failed to export ledger", error);
        alert("Failed to export ledger. Please try again.");
    }
  };

  const handleExportPDF = async () => {
    let accountName = '';
    let companyName = 'AMBE SERVICE'; // Default

    if (ledgerType === 'client') {
        if (selectedSiteId === 'all') {
            accountName = 'Consolidated Client Ledger';
        } else {
            const site = sites.find(s => s.id === selectedSiteId);
            if (site) {
                accountName = site.name;
                const siteNameLower = site.name.toLowerCase();
                if (
                    siteNameLower.includes('ajmera') || 
                    siteNameLower.includes('minerva ho') || 
                    siteNameLower.includes('lift operator')
                ) {
                    companyName = 'AMBE SERVICE FACILITIES PRIVATE LIMITED';
                }
            }
        }
    } else if (ledgerType === 'employee') {
        const emp = employees.find(e => e.id === selectedEmployeeId);
        if (!emp) return;
        accountName = emp.name;
        companyName = 'AMBE SERVICE FACILITIES PRIVATE LIMITED';
    } else {
        accountName = selectedExpenseHead;
        companyName = 'AMBE SERVICE FACILITIES PRIVATE LIMITED';
    }

    try {
        await generateLedgerPDF({
            companyName: companyName,
            accountName: accountName,
            period: `${new Date(startDate).toLocaleDateString('en-GB')} to ${new Date(endDate).toLocaleDateString('en-GB')}`,
            transactions: finalTransactions
        });
    } catch (error) {
        console.error("Failed to export ledger PDF", error);
        alert("Failed to export ledger PDF. Please try again.");
    }
  };

  // Helper to get balance label
  const getBalanceLabel = (balance: number, type: LedgerType) => {
      if (balance === 0) return '';
      
      if (type === 'client') {
          return balance > 0 ? 'Dr (Receivable)' : 'Cr (Advance)';
      } else if (type === 'employee') {
          // Employee is Liability: Credit is positive in my calculation logic
          return balance > 0 ? 'Cr (Payable)' : 'Dr (Paid Extra)';
      } else {
          // Expense: Debit is positive in my calculation logic
          return balance > 0 ? 'Dr' : 'Cr';
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="text-primary" /> Ledger Account
        </h2>
        
        <div className="flex gap-3 items-center flex-wrap">
          
          {/* LEDGER TYPE SELECTOR */}
          <div className="flex items-center bg-white border rounded-lg px-3 py-2 shadow-sm">
             <Briefcase size={16} className="text-gray-400 mr-2" />
             <select 
                value={ledgerType}
                onChange={(e) => setLedgerType(e.target.value as LedgerType)}
                className="bg-transparent text-sm outline-none font-bold text-primary cursor-pointer min-w-[150px]"
             >
                <option value="client">Client Ledger</option>
                <option value="employee">Employee Ledger</option>
                <option value="expense">Expense Ledger</option>
             </select>
          </div>

          {/* ENTITY SELECTOR */}
          <div className="flex items-center bg-white border rounded-lg px-3 py-2 shadow-sm">
             {ledgerType === 'client' && <Building2 size={16} className="text-gray-400 mr-2" />}
             {ledgerType === 'employee' && <User size={16} className="text-gray-400 mr-2" />}
             {ledgerType === 'expense' && <BookOpen size={16} className="text-gray-400 mr-2" />}
             
             {ledgerType === 'client' && (
                 <select value={selectedSiteId} onChange={(e) => setSelectedSiteId(e.target.value)} className="bg-transparent text-sm outline-none font-medium text-gray-700 cursor-pointer min-w-[200px]">
                    <option value="all">All Sites</option>
                    {sites.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}
                 </select>
             )}
             {ledgerType === 'employee' && (
                 <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} className="bg-transparent text-sm outline-none font-medium text-gray-700 cursor-pointer min-w-[200px]">
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                 </select>
             )}
             {ledgerType === 'expense' && (
                 <select value={selectedExpenseHead} onChange={(e) => setSelectedExpenseHead(e.target.value)} className="bg-transparent text-sm outline-none font-medium text-gray-700 cursor-pointer min-w-[200px]">
                    <option value="Salaries">Salaries Expenses</option>
                    <option value="Rent">Rent Expenses</option>
                    <option value="Travelling">Travelling Expenses</option>
                    <option value="Office">Office Expenses</option>
                    <option value="Vendor">Vendor Payments</option>
                 </select>
             )}
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm shadow-sm"
            />
            <span className="text-gray-400">to</span>
            <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm shadow-sm"
            />
          </div>

          <button 
            onClick={() => {
                setEditingId(null);
                setNewEntry({
                    date: new Date().toISOString().split('T')[0],
                    particulars: '',
                    vchType: ledgerType === 'client' ? 'Sales' : (ledgerType === 'employee' ? 'Payment' : 'Purchase'),
                    vchNo: '',
                    debit: 0,
                    credit: 0
                });
                setShowAddModal(true);
            }} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-blue-700 transition-colors"
          >
             <Plus size={18} /> Add Transaction
          </button>

          <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-green-700 transition-colors"><Download size={18} /> Excel</button>
          <button onClick={handleExportPDF} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-red-700 transition-colors"><Download size={18} /> PDF</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <div>
                <h3 className="font-bold text-lg text-gray-800">{getEntityName()}</h3>
                <p className="text-sm text-gray-500">{ledgerType === 'client' ? 'Client Account' : (ledgerType === 'employee' ? 'Employee Account' : 'Expense Account')}</p>
            </div>
            <div className="text-right">
                <p className="text-xs text-gray-500">Closing Balance</p>
                <p className={`font-bold text-xl ${currentBal > 0 ? (ledgerType==='employee'?'text-green-600':'text-red-600') : (ledgerType==='employee'?'text-red-600':'text-green-600')}`}>
                    ₹{Math.abs(currentBal).toLocaleString()} {getBalanceLabel(currentBal, ledgerType)}
                </p>
            </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-gray-500 font-medium uppercase text-xs">
              <tr>
                <th className="p-4 w-32">Date</th>
                <th className="p-4">Particulars</th>
                <th className="p-4 w-24">Vch Type</th>
                <th className="p-4 w-32">Vch No.</th>
                <th className="p-4 text-right w-32">Debit</th>
                <th className="p-4 text-right w-32">Credit</th>
                <th className="p-4 text-right w-32">Balance</th>
                <th className="p-4 w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {openingBalance !== 0 && (
                  <tr className="bg-yellow-50/50">
                      <td className="p-4 text-gray-600 italic">{new Date(startDate).toLocaleDateString('en-GB')}</td>
                      <td className="p-4 font-medium text-gray-800 italic">Opening Balance</td>
                      <td className="p-4 text-gray-500"></td>
                      <td className="p-4 text-gray-500"></td>
                      <td className="p-4 text-right font-bold text-gray-800"></td>
                      <td className="p-4 text-right font-bold text-gray-800"></td>
                      <td className="p-4 text-right font-bold text-blue-700">
                          {Math.abs(openingBalance).toLocaleString()} {getBalanceLabel(openingBalance, ledgerType)}
                      </td>
                      <td className="p-4"></td>
                  </tr>
              )}
              {finalTransactions.map((txn, idx) => (
                  <tr key={idx} className={`hover:bg-gray-50 transition-colors ${txn.status === 'Pending' ? 'bg-yellow-50' : ''}`}>
                    <td className="p-4 text-gray-600">
                        {new Date(txn.date).toLocaleDateString('en-GB')}
                        {txn.status === 'Pending' && <div className="text-[10px] font-bold text-yellow-600 uppercase">Pending Approval</div>}
                    </td>
                    <td className="p-4 font-medium text-gray-800">{txn.particulars}</td>
                    <td className="p-4 text-gray-500">{txn.vchType}</td>
                    <td className="p-4 text-gray-500 font-mono text-xs">{txn.vchNo}</td>
                    <td className="p-4 text-right font-bold text-gray-800">{txn.debit > 0 ? `₹${txn.debit.toLocaleString()}` : '-'}</td>
                    <td className="p-4 text-right font-bold text-gray-800">{txn.credit > 0 ? `₹${txn.credit.toLocaleString()}` : '-'}</td>
                    <td className="p-4 text-right font-bold text-blue-700">
                        {txn.status === 'Pending' ? (
                            <span className="text-gray-400 italic">Pending</span>
                        ) : (
                            `${Math.abs(txn.balance).toLocaleString()} ${getBalanceLabel(txn.balance, ledgerType)}`
                        )}
                    </td>
                    <td className="p-4 flex gap-2 justify-end">
                        {txn.isManual && (
                            <>
                                {txn.status === 'Pending' && userRole === 'SuperAdmin' && (
                                    <button onClick={() => handleApproveEntry(txn)} className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50" title="Approve">
                                        <CheckCircle size={16} />
                                    </button>
                                )}
                                <button onClick={() => handleEdit(txn)} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(txn.id)} className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50">
                                    <Trash2 size={16} />
                                </button>
                            </>
                        )}
                    </td>
                  </tr>
              ))}
              {finalTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    No transactions found for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-50 font-bold border-t">
                <tr>
                    <td colSpan={4} className="p-4 text-right">Totals</td>
                    <td className="p-4 text-right">₹{finalTransactions.reduce((sum, t) => sum + t.debit, 0).toLocaleString()}</td>
                    <td className="p-4 text-right">₹{finalTransactions.reduce((sum, t) => sum + t.credit, 0).toLocaleString()}</td>
                    <td colSpan={2} className="p-4"></td>
                </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                <div className="bg-primary px-6 py-4 flex justify-between items-center">
                    <h3 className="text-white font-bold">{editingId ? 'Edit Transaction' : 'Add Transaction'}</h3>
                    <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input 
                            type="date" 
                            value={newEntry.date} 
                            onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Particulars</label>
                        <input 
                            type="text" 
                            value={newEntry.particulars} 
                            onChange={(e) => setNewEntry({...newEntry, particulars: e.target.value})}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="e.g. Housekeeping Charges"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Voucher Type</label>
                            <select 
                                value={newEntry.vchType} 
                                onChange={(e) => setNewEntry({...newEntry, vchType: e.target.value})}
                                className="w-full border rounded-lg px-3 py-2"
                            >
                                <option value="Purchase">Purchase</option>
                                <option value="Sales">Sales</option>
                                <option value="Receipt">Receipt</option>
                                <option value="Payment">Payment</option>
                                <option value="Journal">Journal</option>
                                <option value="Contra">Contra</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Voucher No</label>
                            <input 
                                type="text" 
                                value={newEntry.vchNo} 
                                onChange={(e) => setNewEntry({...newEntry, vchNo: e.target.value})}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Debit Amount</label>
                            <input 
                                type="number" 
                                value={newEntry.debit} 
                                onChange={(e) => setNewEntry({...newEntry, debit: parseFloat(e.target.value) || 0, credit: 0})}
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Credit Amount</label>
                            <input 
                                type="number" 
                                value={newEntry.credit} 
                                onChange={(e) => setNewEntry({...newEntry, credit: parseFloat(e.target.value) || 0, debit: 0})}
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button onClick={() => setShowAddModal(false)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                        <button onClick={handleSaveEntry} className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Save Entry</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default LedgerTab;
