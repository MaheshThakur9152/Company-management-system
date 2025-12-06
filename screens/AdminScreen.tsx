import React, { useState, useEffect } from 'react';
import { FileText, Users, Plus, Download, LogOut, Menu, FileSpreadsheet, Edit2, LayoutDashboard, CheckCircle, XCircle, Trash2, Search, Filter, CalendarDays, Receipt, Image as ImageIcon, DownloadCloud } from 'lucide-react';
import { getSharedAttendanceData, getInvoices, updateInvoice, getEmployees, addEmployee, updateEmployee, deleteEmployee, getSites } from '../services/mockData';
import { Invoice, Employee, AttendanceRecord, Site } from '../types';
import EditInvoiceModal from '../components/EditInvoiceModal';
import EditEmployeeModal from '../components/EditEmployeeModal';
import GenerateBillModal from '../components/GenerateBillModal';
import { generateBillPDF } from '../utils/pdfGenerator';
import { BillParams } from '../utils/excelGenerator';

// Access the global XLSX variable exposed by the script in index.html
declare const XLSX: any;

interface AdminScreenProps {
  onLogout: () => void;
}

const AdminScreen: React.FC<AdminScreenProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'employees' | 'attendance' | 'photos'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  
  // Employee State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('all');
  
  // Photo Gallery State
  const [selectedPhotoDate, setSelectedPhotoDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Initial Load & Polling
  useEffect(() => {
    const loadData = async () => {
      setAttendanceData(await getSharedAttendanceData());
      setInvoices(await getInvoices());
      setEmployees(await getEmployees());
      setSites(await getSites());
    };
    loadData();
    // Poll every 60s to check for new synced data from supervisors
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleDownloadInvoice = (invoice: Invoice) => {
    const site = sites.find(s => s.id === invoice.siteId);
    if (!site) {
        alert("Site details not found");
        return;
    }

    const billParams: BillParams = {
        site: {
            name: site.name,
            location: site.location,
            clientName: site.clientName,
            clientGstin: site.clientGstin || '27AAACL5105AIZ7'
        },
        invoiceNo: invoice.invoiceNo,
        date: invoice.generatedDate,
        billingPeriod: invoice.billingPeriod,
        workOrderNo: 'WO/2025/001', 
        workOrderDate: '2025-01-01', 
        workOrderPeriod: '2025-2026', 
        items: invoice.items.map(item => ({
            description: item.description,
            hsn: item.hsn,
            rate: item.rate,
            workingDays: item.days,
            persons: item.persons,
            amount: item.amount
        })),
        managementRate: invoice.managementRate || 0,
        cgstRate: 9,
        sgstRate: 9,
        bankDetails: {
            name: 'Axis bank',
            accNo: '924020001871570',
            ifsc: 'UTIB0001572',
            branch: 'kandivali west,Link Road.'
        }
    };
    generateBillPDF(billParams);
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error("Download failed", error);
        window.open(url, '_blank');
    }
  };

  const downloadAllImages = async () => {
    const photos = attendanceData.filter(r => r.date === selectedPhotoDate && r.photoUrl);
    if (photos.length === 0) {
        alert("No photos to download for this date.");
        return;
    }
    
    if (confirm(`Download ${photos.length} images? This might take a moment.`)) {
        for (const record of photos) {
            const emp = employees.find(e => e.id === record.employeeId);
            if (record.photoUrl) {
                await downloadImage(record.photoUrl, `${emp?.name || 'Employee'}_${record.date}.jpg`);
                // Small delay to prevent browser blocking multiple downloads
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }
  };

  // --- Invoice Logic ---
  const handleUpdateInvoice = async (updated: Invoice) => {
    await updateInvoice(updated);
    setInvoices(await getInvoices());
    setEditingInvoice(null);
  };

  const togglePaymentStatus = async (invoice: Invoice) => {
    const updated = { ...invoice, status: invoice.status === 'Paid' ? 'Unpaid' : 'Paid' } as Invoice;
    await handleUpdateInvoice(updated);
  };

  // --- Employee Logic ---
  const handleSaveEmployee = async (emp: Employee) => {
    if (editingEmployee) {
        await updateEmployee(emp);
    } else {
        await addEmployee(emp);
    }
    setEmployees(await getEmployees()); // Refresh list
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = async (id: string) => {
    if (confirm("Are you sure you want to delete this employee?")) {
        await deleteEmployee(id);
        setEmployees(await getEmployees());
    }
  };

  const openAddEmployee = () => {
    setEditingEmployee(null);
    setShowEmployeeModal(true);
  };

  const openEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setShowEmployeeModal(true);
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.biometricCode.includes(searchTerm)
  );

  /**
   * Generates Excel (.xlsx) with exact styling, colors, and layout.
   */
  const downloadExcelReport = () => {
    if (typeof XLSX === 'undefined') {
      alert("Excel library loading... please wait a moment.");
      return;
    }

    const employeesToExport = selectedSiteFilter === 'all' 
        ? employees 
        : employees.filter(e => e.siteId === selectedSiteFilter);

    if (employeesToExport.length === 0) {
        alert("No employees found for the selected site.");
        return;
    }

    const monthYear = "NOV - 2025";
    const daysInMonth = 31;
    const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);

    // --- STYLES DEFINITION ---
    const styleTitle = { font: { bold: true, sz: 14 }, alignment: { horizontal: "center" } };
    const styleHeader = { 
        font: { bold: true }, 
        fill: { fgColor: { rgb: "E0E0E0" } }, // Light Gray
        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true }
    };
    const styleCellNormal = { 
        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
        alignment: { horizontal: "center" }
    };
    const styleWO = { ...styleCellNormal, fill: { fgColor: { rgb: "92D050" } } }; // Green
    const styleHD = { ...styleCellNormal, fill: { fgColor: { rgb: "FFFF00" } } }; // Yellow
    const styleAbsent = { ...styleCellNormal, font: { color: { rgb: "FF0000" } } }; // Red Text
    const styleLeft = { ...styleCellNormal, alignment: { horizontal: "left" } };
    const styleBold = { ...styleCellNormal, font: { bold: true } };

    // --- DATA PREPARATION ---
    const wb = XLSX.utils.book_new();
    const ws_data: any[][] = [];

    // Row 1: Empty Spacer
    ws_data.push([]); 

    // Row 2: Company Name (Merged)
    ws_data.push(["", "AMBE SERVICE FACILITY PVT. LTD."]); 

    // Row 3: Site Name (Merged)
    let siteName = "ALL SITES";
    if (selectedSiteFilter !== 'all') {
        const site = sites.find(s => s.id === selectedSiteFilter);
        if (site) siteName = `SITE - ${site.name.toUpperCase()}`;
    }
    ws_data.push(["", siteName]);

    // Row 4: Month (Merged)
    ws_data.push(["", `ATTENDANCE FOR THE MONTH OF ${monthYear}`]);

    // Row 5: Column Headers
    const headerRow = ["SR", "Biometric Code", "Employee Name", "Weekly Off", ...daysArray, "TOTAL PRESENT DAYS", "WEEKLY OFF", "HD", "TOTAL DAYS"];
    ws_data.push(headerRow);

    // Row 6: Day Names (e.g., Mon, Tue)
    const dayNamesRow = ["", "", "", "", ...daysArray.map(d => new Date(2025, 10, d).toLocaleDateString('en-US', {weekday: 'short'})), "", "", "", ""];
    ws_data.push(dayNamesRow);

    // --- EMPLOYEE DATA ROWS ---
    let totalPresentPerDay = new Array(daysInMonth).fill(0);
    // Assuming full strength is total employees for simplicity, or we count only active ones
    let totalStrengthPerDay = new Array(daysInMonth).fill(employeesToExport.length);
    let totalPresentSum = 0;

    employeesToExport.forEach((emp, index) => {
        const empRecords = attendanceData.filter(r => r.employeeId === emp.id);
        const rowData: any[] = [index + 1, emp.biometricCode, emp.name, emp.weeklyOff];
        
        let rowPresent = 0;
        let rowWO = 0;
        let rowHD = 0;

        daysArray.forEach((day, i) => {
            const dateStr = `2025-11-${day.toString().padStart(2, '0')}`;
            const record = empRecords.find(r => r.date === dateStr);
            
            // Logic to determine cell value
            if (record) {
                if (record.status === 'P') { 
                    rowData.push("P"); 
                    rowPresent++; 
                    totalPresentPerDay[i]++;
                } else if (record.status === 'A') { 
                    rowData.push("A"); 
                } else if (record.status === 'HD') { 
                    rowData.push("HD"); 
                    rowHD++; 
                    rowPresent += 0.5;
                    totalPresentPerDay[i] += 0.5;
                } else if (record.status === 'W/O') {
                    rowData.push("W/O");
                    rowWO++;
                } else {
                    rowData.push(""); 
                }
            } else {
                // Future dates or missing data
                 const isFuture = new Date(dateStr) > new Date();
                 rowData.push(isFuture ? "" : "A"); 
            }
        });

        const totalDays = rowPresent + rowWO + (rowHD * 0.5);
        totalPresentSum += rowPresent;

        rowData.push(rowPresent.toFixed(2));
        rowData.push(rowWO.toFixed(2));
        rowData.push(rowHD.toFixed(2));
        rowData.push(totalDays.toFixed(2));

        ws_data.push(rowData);
        
        // Add Secondary Row for HD indicators (Requested format usually has 2 rows per emp)
        // Filling empty for now to match layout structure
        const hdRow = ["", "", "", "", ...Array(31).fill(""), "", "", "", ""];
        ws_data.push(hdRow);
    });

    // --- FOOTER ROWS ---
    // Present Strength
    const presentStrengthRow = ["", "PRESENT STRENGTH", "", "", ...totalPresentPerDay.map(n => n === 0 ? "" : n), totalPresentSum.toFixed(2), "GOOD DAY", "", ""];
    ws_data.push(presentStrengthRow);

    // Total Strength
    const totalStrengthRow = ["", "TOTAL STRENGTH", "", "", ...totalStrengthPerDay, totalPresentSum.toFixed(2), "", "", ""];
    ws_data.push(totalStrengthRow);

    // Spacer
    ws_data.push([]);
    ws_data.push([]);

    // --- STATISTICS BOX ---
    ws_data.push(["", "N/J", "NEW JOINING", "", "", "", "", "", "", "", "", "", "", "", "", "JANITORS", "", "", "", ""]);
    ws_data.push(["", "W/O", "WEEKLY OFF", "", "", "", "", "", "", "", "", "", "", "", "", "Monthly Approved Manpower", "", "", "", `5 x 31 = 155`]);
    ws_data.push(["", "HD", "HOLIDAY/HALF DAY", "", "", "", "", "", "", "", "", "", "", "", "", "(Excess)/Shortage Manpower", "", "", "", `${(155 - totalPresentSum).toFixed(2)}`]);
    ws_data.push(["", "H/F", "IN/OUT BIOMETRIC MISSING", "", "", "", "", "", "", "", "", "", "", "", "", "Monthly %", "", "", "", `${((totalPresentSum/155)*100).toFixed(2)}%`]);

    // --- CREATE WORKSHEET & APPLY STYLES ---
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Column Widths
    const wscols = [
        { wch: 5 }, // SR
        { wch: 15 }, // Code
        { wch: 25 }, // Name
        { wch: 12 }, // WO
        ...Array(31).fill({ wch: 4 }), // Days
        { wch: 10 }, // Totals
        { wch: 10 },
        { wch: 8 },
        { wch: 10 }
    ];
    ws['!cols'] = wscols;

    // Merges
    ws['!merges'] = [
        { s: { r: 1, c: 1 }, e: { r: 1, c: 38 } }, // Company Name
        { s: { r: 2, c: 1 }, e: { r: 2, c: 38 } }, // Site Name
        { s: { r: 3, c: 1 }, e: { r: 3, c: 38 } }, // Month
    ];

    // --- APPLY CELL STYLES ---
    Object.keys(ws).forEach(cellRef => {
        if (cellRef[0] === '!') return; // Skip metadata
        const cell = ws[cellRef];
        const cellAddress = XLSX.utils.decode_cell(cellRef);
        const { r, c } = cellAddress;

        // Header Titles (Rows 1, 2, 3 -> Indexes 1, 2, 3)
        if (r >= 1 && r <= 3 && c === 1) {
            cell.s = styleTitle;
        }

        // Column Headers (Row 4 & 5 -> Indexes 4, 5)
        if (r === 4 || r === 5) {
            cell.s = styleHeader;
        }

        // Data Rows (Starting Row 6 -> Index 6)
        // Employee data block size = employeesToExport.length * 2 (because of HD row)
        const dataStartIndex = 6;
        const dataEndIndex = dataStartIndex + (employeesToExport.length * 2);

        if (r >= dataStartIndex && r < dataEndIndex) {
            // Apply styles based on value
            const val = cell.v;
            
            if (val === "P") cell.s = styleCellNormal;
            else if (val === "A") cell.s = styleAbsent;
            else if (val === "W/O") cell.s = styleWO;
            else if (val === "HD") cell.s = styleHD;
            else if (c === 2) cell.s = styleLeft; // Name column
            else cell.s = styleCellNormal;
            
            // Secondary row (odd rows relative to start) should just have borders
            if ((r - dataStartIndex) % 2 !== 0) {
                 cell.s = styleCellNormal; // Reset style for HD row spacers
            }
        }
        
        // Footer (Strength)
        if (r === dataEndIndex || r === dataEndIndex + 1) {
             cell.s = styleBold;
        }
    });

    // Append Sheet
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Nov 25");

    // Write File
    XLSX.writeFile(wb, `Attendance_Report_${monthYear}.xlsx`);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-[#333] text-white flex-shrink-0 transition-all">
        <div className="p-6 bg-[#2a2a2a] border-b border-gray-700">
          <div className="flex items-center gap-3">
             <div className="bg-primary p-2 rounded-lg shadow-lg shadow-teal-500/20">
               <LayoutDashboard size={20} className="text-white" />
             </div>
             <div>
               <h1 className="font-bold text-lg leading-tight tracking-wide">Admin Panel</h1>
               <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Ambe Facility</p>
             </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('invoices')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
              ${activeTab === 'invoices' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <FileText size={20} className={activeTab === 'invoices' ? 'text-white' : 'text-gray-500 group-hover:text-white'} />
            <span className="font-medium text-sm">Billing & Invoices</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('employees')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
              ${activeTab === 'employees' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Users size={20} className={activeTab === 'employees' ? 'text-white' : 'text-gray-500 group-hover:text-white'} />
            <span className="font-medium text-sm">Employee Management</span>
          </button>

          <button 
            onClick={() => setActiveTab('attendance')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
              ${activeTab === 'attendance' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <CalendarDays size={20} className={activeTab === 'attendance' ? 'text-white' : 'text-gray-500 group-hover:text-white'} />
            <span className="font-medium text-sm">Attendance View</span>
          </button>

          <button 
            onClick={() => setActiveTab('photos')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
              ${activeTab === 'photos' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <ImageIcon size={20} className={activeTab === 'photos' ? 'text-white' : 'text-gray-500 group-hover:text-white'} />
            <span className="font-medium text-sm">Photo Gallery</span>
          </button>
        </nav>
        
        <div className="p-4 border-t border-gray-700 bg-[#2a2a2a]">
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-white/5 hover:text-red-300 rounded-lg transition-colors text-sm font-medium">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg"><Menu className="text-primary" size={20} /></div>
              <h1 className="font-bold text-gray-800 text-lg">Admin</h1>
            </div>
            <button onClick={onLogout}><LogOut size={20} className="text-gray-500" /></button>
        </div>

        {/* Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 hide-scrollbar">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* --- INVOICES TAB --- */}
                {activeTab === 'invoices' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Invoice Management</h2>
                              <p className="text-gray-500 text-sm mt-1">View, edit and export monthly billing reports.</p>
                            </div>
                            <div className="flex gap-3">
                              <select 
                                value={selectedSiteFilter}
                                onChange={(e) => setSelectedSiteFilter(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                              >
                                <option value="all">All Sites</option>
                                {sites.map(site => (
                                    <option key={site.id} value={site.id}>{site.name}</option>
                                ))}
                              </select>
                              <button 
                                  onClick={() => setShowBillModal(true)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-95"
                              >
                                  <Receipt size={18} />
                                  <span className="font-medium text-sm">Generate Bill</span>
                              </button>
                              <button onClick={downloadExcelReport} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-95">
                                  <FileSpreadsheet size={18} /> 
                                  <span className="font-medium text-sm">Export Excel Report</span>
                              </button>
                            </div>
                        </div>

                        {/* Invoice Table Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                           <div className="overflow-x-auto">
                             <table className="w-full text-left">
                                 <thead className="bg-gray-50 border-b border-gray-200">
                                   <tr>
                                     <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice Details</th>
                                     <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Billing Period</th>
                                     <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                     <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                     <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                   </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-100">
                                     {invoices.map(inv => (
                                         <tr key={inv.id} className="hover:bg-blue-50/50 transition-colors group">
                                             <td className="px-6 py-4">
                                                 <div className="font-bold text-gray-900 group-hover:text-primary transition-colors">{inv.siteName}</div>
                                                 <div className="text-xs text-gray-400 font-mono mt-0.5">{inv.invoiceNo}</div>
                                             </td>
                                             <td className="px-6 py-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                                  {inv.billingPeriod}
                                                </div>
                                             </td>
                                             <td className="px-6 py-4 font-bold text-gray-900 font-mono tracking-tight">₹{inv.amount.toLocaleString()}</td>
                                             <td className="px-6 py-4">
                                                 <button 
                                                   onClick={() => togglePaymentStatus(inv)} 
                                                   className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all active:scale-95
                                                   ${inv.status === 'Paid' 
                                                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                                      : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}
                                                 >
                                                     {inv.status === 'Paid' ? <CheckCircle size={12} /> : <XCircle size={12} />} 
                                                     {inv.status}
                                                 </button>
                                             </td>
                                             <td className="px-6 py-4 text-right">
                                                 <div className="flex items-center justify-end gap-2">
                                                     <button 
                                                        onClick={() => handleDownloadInvoice(inv)} 
                                                        className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                        title="Download Invoice"
                                                     >
                                                       <Download size={18} />
                                                     </button>
                                                     <button 
                                                        onClick={() => setEditingInvoice(inv)} 
                                                        className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                                        title="Edit Invoice"
                                                     >
                                                       <Edit2 size={18} />
                                                     </button>
                                                 </div>
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                           </div>
                        </div>
                    </div>
                )}

                {/* --- EMPLOYEES TAB --- */}
                {activeTab === 'employees' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Staff Directory</h2>
                                <p className="text-gray-500 text-sm mt-1">Manage employees and assignments.</p>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                              <div className="relative flex-1 md:w-64">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    placeholder="Search staff..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
                                />
                              </div>
                              <button 
                                onClick={openAddEmployee}
                                className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm hover:bg-teal-600 transition-colors"
                              >
                                <Plus size={16} /> Add Staff
                              </button>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                            {filteredEmployees.map(emp => (
                                <div key={emp.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center gap-4 cursor-pointer" onClick={() => openEditEmployee(emp)}>
                                          <div className="relative">
                                            <img src={emp.photoUrl} className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 group-hover:border-primary transition-colors" />
                                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${emp.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                          </div>
                                          <div>
                                              <h3 className="font-bold text-gray-800 text-base group-hover:text-primary transition-colors">{emp.name}</h3>
                                              <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{emp.biometricCode}</span>
                                                <span className="text-xs text-gray-500">{emp.role}</span>
                                              </div>
                                          </div>
                                      </div>
                                      <div className="flex flex-col gap-1">
                                          <button onClick={() => openEditEmployee(emp)} className="text-gray-300 hover:text-blue-500 p-1 rounded transition-colors"><Edit2 size={16} /></button>
                                          <button onClick={() => handleDeleteEmployee(emp.id)} className="text-gray-300 hover:text-red-500 p-1 rounded transition-colors"><Trash2 size={16} /></button>
                                      </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                                      <div className="flex items-center gap-1">
                                        <span>Joined:</span>
                                        <span className="font-medium text-gray-700">{emp.joiningDate}</span>
                                      </div>
                                      <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">
                                        {emp.siteId === 's1' ? 'Ajmera' : 'Bhakti Park'}
                                      </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- ATTENDANCE TAB (VISUAL GRID) --- */}
                {activeTab === 'attendance' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Attendance Grid</h2>
                                <p className="text-gray-500 text-sm mt-1">Live visual inspection of current month's data.</p>
                            </div>
                            <div className="flex gap-3">
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                            <table className="w-full text-center border-collapse text-xs">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-600 font-bold border-b border-gray-200">
                                        <th className="p-3 sticky left-0 bg-gray-100 z-10 border-r text-left">Employee</th>
                                        {Array.from({length: 31}, (_, i) => i + 1).map(d => {
                                            const date = new Date(2025, 10, d);
                                            const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
                                            return (
                                                <th key={d} className="p-2 min-w-[30px] border-r">
                                                    <div className="flex flex-col items-center">
                                                        <span>{d}</span>
                                                        <span className="text-[9px] font-normal text-gray-400 uppercase">{weekday}</span>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map((emp) => {
                                        const empRecords = attendanceData.filter(r => r.employeeId === emp.id);
                                        return (
                                            <tr key={emp.id} className="border-b hover:bg-gray-50">
                                                <td className="p-3 sticky left-0 bg-white z-10 border-r text-left font-medium text-gray-800 whitespace-nowrap">
                                                    {(() => {
                                                        const d = emp.salaryDetails?.deductionBreakdown;
                                                        const total = (d?.advance||0) + (d?.uniform||0) + (d?.shoes||0) + (d?.others||0);
                                                        if (total > 0) {
                                                            const breakdown = [
                                                                d?.advance ? `Adv: ${d.advance}` : '',
                                                                d?.uniform ? `Uni: ${d.uniform}` : '',
                                                                d?.shoes ? `Shoes: ${d.shoes}` : '',
                                                                d?.others ? `Oth: ${d.others}` : ''
                                                            ].filter(Boolean).join(', ');
                                                            return (
                                                                <div className="group relative w-fit">
                                                                    <div className="text-[10px] text-red-500 font-bold mb-0.5 cursor-help border-b border-dotted border-red-300">
                                                                        ₹{total}
                                                                    </div>
                                                                    <div className="hidden group-hover:block absolute left-0 bottom-full mb-1 bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
                                                                        {breakdown}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                    {emp.name} <br/>
                                                    <span className="text-[10px] text-gray-400">{emp.biometricCode}</span>
                                                </td>
                                                {Array.from({length: 31}, (_, i) => i + 1).map(day => {
                                                    const dateStr = `2025-11-${day.toString().padStart(2, '0')}`;
                                                    const record = empRecords.find(r => r.date === dateStr);
                                                    
                                                    let content = <span className="text-gray-200">-</span>;
                                                    let bgClass = "";

                                                    if (record) {
                                                        if (record.status === 'P') { 
                                                            if (record.photoUrl) {
                                                                content = (
                                                                    <div className="flex justify-center items-center group relative w-full h-full">
                                                                        <img src={record.photoUrl} className="w-8 h-8 rounded object-cover border border-green-500" alt="P" />
                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 min-w-[150px]">
                                                                            <div className="bg-white p-2 rounded-lg shadow-xl border-2 border-gray-100">
                                                                                <img src={record.photoUrl} className="w-32 h-32 rounded object-cover mb-2" alt="Preview" />
                                                                                <button 
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        downloadImage(record.photoUrl!, `${emp.name}_${record.date}.jpg`);
                                                                                    }}
                                                                                    className="w-full flex items-center justify-center gap-1 bg-blue-50 text-blue-600 text-[10px] font-bold py-1 rounded hover:bg-blue-100"
                                                                                >
                                                                                    <DownloadCloud size={12} /> Download
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            } else {
                                                                content = <span className="text-green-600 font-bold">P</span>; 
                                                            }
                                                        }
                                                        if (record.status === 'A') { content = <span className="text-red-500 font-bold">A</span>; bgClass="bg-red-50"; }
                                                        if (record.status === 'HD') { content = <span className="text-orange-600 font-bold">HD</span>; bgClass="bg-orange-50"; }
                                                        if (record.status === 'W/O') { content = <span className="text-blue-600 font-bold">WO</span>; bgClass="bg-blue-50"; }
                                                    }

                                                    return <td key={day} className={`border-r p-1 ${bgClass}`}>{content}</td>
                                                })}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- PHOTOS TAB --- */}
                {activeTab === 'photos' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Daily Photo Gallery</h2>
                                <p className="text-gray-500 text-sm mt-1">View and download site photos for any specific date.</p>
                            </div>
                            <div className="flex gap-3 items-center">
                                <button 
                                    onClick={downloadAllImages}
                                    className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                                >
                                    <DownloadCloud size={16} />
                                    <span className="hidden md:inline">Download All</span>
                                </button>
                                <div className="flex items-center bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                                    <CalendarDays size={18} className="text-gray-500 ml-2" />
                                    <input 
                                        type="date" 
                                        value={selectedPhotoDate}
                                        onChange={(e) => setSelectedPhotoDate(e.target.value)}
                                        className="outline-none text-sm font-medium text-gray-700 bg-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {attendanceData
                                .filter(r => r.date === selectedPhotoDate && r.photoUrl)
                                .map((record, idx) => {
                                    const emp = employees.find(e => e.id === record.employeeId);
                                    const site = sites.find(s => s.id === emp?.siteId);
                                    return (
                                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-all">
                                            <div className="aspect-square relative overflow-hidden bg-gray-100">
                                                <img 
                                                    src={record.photoUrl} 
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                                    alt="Attendance" 
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                    <button 
                                                        onClick={() => downloadImage(record.photoUrl!, `${emp?.name}_${record.date}.jpg`)}
                                                        className="bg-white text-gray-800 p-2 rounded-full shadow-lg hover:bg-blue-50 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0"
                                                        title="Download Image"
                                                    >
                                                        <DownloadCloud size={20} />
                                                    </button>
                                                </div>
                                                <button 
                                                    onClick={() => downloadImage(record.photoUrl!, `${emp?.name}_${record.date}.jpg`)}
                                                    className="md:hidden absolute top-2 right-2 bg-white/90 text-gray-800 p-1.5 rounded-full shadow-sm"
                                                >
                                                    <DownloadCloud size={16} />
                                                </button>
                                            </div>
                                            <div className="p-3">
                                                <h3 className="font-bold text-gray-800 text-sm truncate">{emp?.name || 'Unknown'}</h3>
                                                <p className="text-xs text-gray-500 truncate">{site?.name || 'Unknown Site'}</p>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                                        {new Date(record.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                    <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">Present</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            }
                            {attendanceData.filter(r => r.date === selectedPhotoDate && r.photoUrl).length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                                    <ImageIcon size={64} className="opacity-20 mb-4" />
                                    <p className="text-lg font-medium">No photos found for this date</p>
                                    <p className="text-sm">Try selecting a different date</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>

        <EditInvoiceModal isOpen={!!editingInvoice} invoice={editingInvoice} onClose={() => setEditingInvoice(null)} onSave={handleUpdateInvoice} />
        <EditEmployeeModal 
            isOpen={showEmployeeModal} 
            employee={editingEmployee} 
            onClose={() => setShowEmployeeModal(false)} 
            onSave={handleSaveEmployee} 
        />
        <GenerateBillModal 
            isOpen={showBillModal}
            onClose={() => setShowBillModal(false)}
            employees={employees}
            attendanceData={attendanceData}
            sites={sites}
        />
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-2 pb-4 z-50">
          <button onClick={() => setActiveTab('invoices')} className={`flex flex-col items-center gap-1 p-2 rounded-lg ${activeTab === 'invoices' ? 'text-primary' : 'text-gray-400'}`}>
            <FileText size={20} />
            <span className="text-[10px] font-medium">Billing</span>
          </button>
          <button onClick={() => setActiveTab('employees')} className={`flex flex-col items-center gap-1 p-2 rounded-lg ${activeTab === 'employees' ? 'text-primary' : 'text-gray-400'}`}>
            <Users size={20} />
            <span className="text-[10px] font-medium">Staff</span>
          </button>
          <button onClick={() => setActiveTab('attendance')} className={`flex flex-col items-center gap-1 p-2 rounded-lg ${activeTab === 'attendance' ? 'text-primary' : 'text-gray-400'}`}>
            <CalendarDays size={20} />
            <span className="text-[10px] font-medium">View</span>
          </button>
          <button onClick={() => setActiveTab('photos')} className={`flex flex-col items-center gap-1 p-2 rounded-lg ${activeTab === 'photos' ? 'text-primary' : 'text-gray-400'}`}>
            <ImageIcon size={20} />
            <span className="text-[10px] font-medium">Photos</span>
          </button>
      </div>
    </div>
  );
};

export default AdminScreen;