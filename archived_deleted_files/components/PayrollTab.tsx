import React, { useState } from 'react';
import { Employee, AttendanceRecord, Site, SalaryRecord } from '../types';
import { Download, Filter, Edit2, DollarSign, CheckCircle, XCircle, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import EditPayrollModal from './EditPayrollModal';
import { updateEmployee, getEmployees, getSalaryRecords, updateSalaryRecord } from '../services/mockData';

interface PayrollTabProps {
  employees: Employee[];
  attendanceData: AttendanceRecord[];
  sites: Site[];
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
  onExport: (siteId: string) => void;
}

const PayrollTab: React.FC<PayrollTabProps> = ({
  employees,
  attendanceData,
  sites,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  onExport
}) => {
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('all');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [localEmployees, setLocalEmployees] = useState<Employee[]>(employees);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  // Sync local employees when props change
  React.useEffect(() => {
    setLocalEmployees(employees);
  }, [employees]);

  // Fetch salary records on mount
  React.useEffect(() => {
    const loadRecords = async () => {
      const records = await getSalaryRecords();
      setSalaryRecords(records);
    };
    loadRecords();
  }, []);

  const handleSaveEmployee = async (updatedEmp: Employee) => {
    await updateEmployee(updatedEmp);
    // Refresh local state (in a real app, this would trigger a re-fetch from parent)
    const updatedList = localEmployees.map(e => e.id === updatedEmp.id ? updatedEmp : e);
    setLocalEmployees(updatedList);
    setShowEditModal(false);
    setEditingEmployee(null);
  };



  const filteredEmployees = localEmployees.filter(e => {
    const matchesSite = selectedSiteFilter === 'all' || e.siteId === selectedSiteFilter;
    
    // Filter out inactive employees who left before the selected month
    let isVisible = true;
    if (e.status === 'Inactive' && e.leavingDate) {
        const leavingDate = new Date(e.leavingDate);
        const reportMonthStart = new Date(selectedYear, selectedMonth - 1, 1);
        
        // If they left before the start of the current report month, hide them
        if (leavingDate < reportMonthStart) {
            isVisible = false;
        }
    }
    
    return matchesSite && isVisible;
  });

  const calculatePayroll = (emp: Employee) => {
    const empRecords = attendanceData.filter(r => {
      const d = new Date(r.date);
      return r.employeeId === emp.id && d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });

    const pd = empRecords.filter(r => r.status === 'P').length;
    const wo = empRecords.filter(r => r.status === 'W/O').length;
    const woe = empRecords.filter(r => r.status === 'WOE').length;
    const ph = empRecords.filter(r => r.status === 'PH').length; // Holiday
    const hde = empRecords.filter(r => r.status === 'HDE').length;
    const hdHalf = empRecords.filter(r => r.status === 'HD').length;

    const effectivePD = pd + (hdHalf * 0.5);
    const totalPaidDays = effectivePD + wo + woe + ph + hde;
    const totalOTHours = empRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

    const salaryDetails = emp.salaryDetails || {};
    const baseSalary = salaryDetails.baseSalary || 0;
    const isDailyRated = salaryDetails.isDailyRated || false;
    const dailyRateOverride = salaryDetails.dailyRateOverride || 0;

    let dailyRate = 0;
    if (isDailyRated) {
      dailyRate = dailyRateOverride;
    } else {
      dailyRate = baseSalary / 31;
    }
    const hourlyRate = dailyRate / 9;

    const daysAmount = totalPaidDays * dailyRate;
    const otAmount = totalOTHours * hourlyRate;
    const grossSalary = daysAmount + otAmount;

    const ded = salaryDetails.deductionBreakdown || {};
    const totalDeductions = (ded.advance || 0) + (ded.uniform || 0) + (ded.shoes || 0) + (ded.idCard || 0) + (ded.cbre || 0) + (ded.others || 0);

    const netBeforeAllowances = grossSalary - totalDeductions;
    const allowances = (salaryDetails.allowancesBreakdown?.travelling || 0) + (salaryDetails.allowancesBreakdown?.others || 0);
    const finalNet = netBeforeAllowances + allowances;

    return {
      dailyRate,
      totalPaidDays,
      grossSalary,
      totalDeductions,
      finalNet,
      breakdown: {
        deductions: ded,
        allowances: salaryDetails.allowancesBreakdown
      }
    };
  };

  const getSalaryStatus = (empId: string) => {
    const record = salaryRecords.find(r => 
      r.employeeId === empId && 
      r.month === selectedMonth && 
      r.year === selectedYear
    );
    return {
      status: record?.status || 'Unpaid',
      compliance: record?.complianceStatus || 'Pending',
      record: record
    };
  };

  const toggleSalaryStatus = async (empId: string) => {
    const emp = localEmployees.find(e => e.id === empId);
    if (!emp) return;
    
    const current = getSalaryStatus(empId);
    const newStatus = current.status === 'Paid' ? 'Unpaid' : 'Paid';
    
    // If we have a record, use its values, otherwise calculate
    let stats;
    if (current.record && current.record.breakdown) {
        stats = {
            finalNet: current.record.netSalary,
            grossSalary: current.record.grossSalary || 0,
            totalDeductions: current.record.totalDeductions || 0,
            breakdown: current.record.breakdown
        };
    } else {
        stats = calculatePayroll(emp);
    }

    const recordId = `${empId}_${selectedMonth}_${selectedYear}`;
    const record: SalaryRecord = {
      id: recordId,
      employeeId: empId,
      month: selectedMonth,
      year: selectedYear,
      netSalary: stats.finalNet,
      grossSalary: stats.grossSalary,
      totalDeductions: stats.totalDeductions,
      breakdown: stats.breakdown,
      status: newStatus,
      complianceStatus: current.compliance,
      paymentDate: newStatus === 'Paid' ? new Date().toISOString() : undefined
    };

    await updateSalaryRecord(record);

    // If marking as Paid, clear one-time deductions (Advance) from Employee profile
    if (newStatus === 'Paid' && emp.salaryDetails?.deductionBreakdown?.advance) {
        const updatedEmp = { ...emp };
        if (!updatedEmp.salaryDetails) updatedEmp.salaryDetails = {};
        if (!updatedEmp.salaryDetails.deductionBreakdown) updatedEmp.salaryDetails.deductionBreakdown = {};
        
        // Clear Advance
        updatedEmp.salaryDetails.deductionBreakdown.advance = 0;
        
        await updateEmployee(updatedEmp);
        
        // Update local state
        const updatedList = localEmployees.map(e => e.id === updatedEmp.id ? updatedEmp : e);
        setLocalEmployees(updatedList);
    }

    const allRecords = await getSalaryRecords();
    setSalaryRecords(allRecords);
  };



  const toggleSelectAll = () => {
    if (selectedEmployeeIds.length === filteredEmployees.length && filteredEmployees.length > 0) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(filteredEmployees.map(e => e.id));
    }
  };

  const toggleSelectEmployee = (id: string) => {
    if (selectedEmployeeIds.includes(id)) {
      setSelectedEmployeeIds(selectedEmployeeIds.filter(e => e !== id));
    } else {
      setSelectedEmployeeIds([...selectedEmployeeIds, id]);
    }
  };

  const handleBulkStatusUpdate = async (status: 'Paid' | 'Unpaid') => {
    if (!confirm(`Mark ${selectedEmployeeIds.length} employees as ${status}?`)) return;
    
    for (const empId of selectedEmployeeIds) {
      const current = getSalaryStatus(empId);
      // Skip if already in desired status
      if (current.status === status) continue;

      const emp = localEmployees.find(e => e.id === empId);
      if (!emp) continue;
      
      let stats;
      if (current.record && current.record.breakdown) {
          stats = {
              finalNet: current.record.netSalary,
              grossSalary: current.record.grossSalary || 0,
              totalDeductions: current.record.totalDeductions || 0,
              breakdown: current.record.breakdown
          };
      } else {
          stats = calculatePayroll(emp);
      }

      const recordId = `${empId}_${selectedMonth}_${selectedYear}`;
      
      const record: SalaryRecord = {
        id: recordId,
        employeeId: empId,
        month: selectedMonth,
        year: selectedYear,
        netSalary: stats.finalNet,
        grossSalary: stats.grossSalary,
        totalDeductions: stats.totalDeductions,
        breakdown: stats.breakdown,
        status: status,
        complianceStatus: current.compliance,
        paymentDate: status === 'Paid' ? new Date().toISOString() : undefined
      };
      
      await updateSalaryRecord(record);

      // If marking as Paid, clear one-time deductions (Advance) from Employee profile
      if (status === 'Paid' && emp.salaryDetails?.deductionBreakdown?.advance) {
          const updatedEmp = { ...emp };
          if (!updatedEmp.salaryDetails) updatedEmp.salaryDetails = {};
          if (!updatedEmp.salaryDetails.deductionBreakdown) updatedEmp.salaryDetails.deductionBreakdown = {};
          
          // Clear Advance
          updatedEmp.salaryDetails.deductionBreakdown.advance = 0;
          
          await updateEmployee(updatedEmp);
          
          // Update local state (Note: inside loop, this might be inefficient but safe)
          // Actually, we should batch update local state or just re-fetch at end
      }
    }
    
    // Refresh everything
    const allRecords = await getSalaryRecords();
    setSalaryRecords(allRecords);
    const allEmps = await getEmployees(); // Re-fetch employees to get updated deductions
    setLocalEmployees(allEmps);
    setSelectedEmployeeIds([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="text-primary" /> Payroll Management
        </h2>
        
        <div className="flex gap-3 items-center">
          {/* Month Filter */}
          <div className="flex items-center bg-white border rounded-lg px-3 py-2 shadow-sm">
             <select 
                value={selectedMonth}
                onChange={(e) => onMonthChange(parseInt(e.target.value))}
                className="bg-transparent text-sm outline-none font-medium text-gray-700 cursor-pointer mr-2"
             >
                {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{new Date(2000, m-1, 1).toLocaleString('default', { month: 'short' })}</option>
                ))}
             </select>
             <select 
                value={selectedYear}
                onChange={(e) => onYearChange(parseInt(e.target.value))}
                className="bg-transparent text-sm outline-none font-medium text-gray-700 cursor-pointer border-l pl-2"
             >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
             </select>
          </div>

          {/* Site Filter */}
          <div className="flex items-center bg-white border rounded-lg px-3 py-2 shadow-sm">
             <Filter size={16} className="text-gray-400 mr-2" />
             <select 
                value={selectedSiteFilter}
                onChange={(e) => setSelectedSiteFilter(e.target.value)}
                className="bg-transparent text-sm outline-none font-medium text-gray-700 cursor-pointer"
             >
                <option value="all">All Sites</option>
                {sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                ))}
             </select>
          </div>

          <button onClick={() => onExport(selectedSiteFilter)} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-green-700 transition-colors">
             <Download size={18} /> Export Payroll
          </button>
        </div>
      </div>

      {selectedEmployeeIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-blue-800 font-medium">
            <CheckSquare size={18} />
            <span>{selectedEmployeeIds.length} employees selected</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleBulkStatusUpdate('Paid')}
              className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
            >
              Mark as Paid
            </button>
            <button 
              onClick={() => handleBulkStatusUpdate('Unpaid')}
              className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
            >
              Mark as Unpaid
            </button>
            <button 
              onClick={() => setSelectedEmployeeIds([])}
              className="text-gray-500 hover:text-gray-700 px-3 py-1.5 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[1000px]">
            <thead className="bg-gray-50 border-b text-gray-500 font-medium uppercase text-xs">
              <tr>
                <th className="p-4 w-10">
                  <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                    {selectedEmployeeIds.length === filteredEmployees.length && filteredEmployees.length > 0 ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} />}
                  </button>
                </th>
                <th className="p-4">Employee</th>
                <th className="p-4 text-right">Base / Rate</th>
                <th className="p-4 text-center">Paid Days</th>
                <th className="p-4 text-right">Gross Salary</th>
                <th className="p-4 text-right">Deductions</th>
                <th className="p-4 text-right">Net Salary</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.map(emp => {
                const status = getSalaryStatus(emp.id);
                let stats;
                
                // If we have a historical record with breakdown, use it for financial values
                if (status.record && status.record.breakdown) {
                    const currentCalc = calculatePayroll(emp); // Get days/rates from current data
                    stats = {
                        ...currentCalc,
                        grossSalary: status.record.grossSalary || currentCalc.grossSalary,
                        totalDeductions: status.record.totalDeductions || currentCalc.totalDeductions,
                        finalNet: status.record.netSalary
                    };
                } else {
                    stats = calculatePayroll(emp);
                }

                const isSelected = selectedEmployeeIds.includes(emp.id);
                return (
                  <tr key={emp.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}>
                    <td className="p-4">
                      <button onClick={() => toggleSelectEmployee(emp.id)} className="text-gray-400 hover:text-gray-600">
                        {isSelected ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} />}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-800">{emp.name}</div>
                      <div className="text-xs text-gray-500">{emp.role}</div>
                      <div className="text-[10px] text-gray-400">{sites.find(s => s.id === emp.siteId)?.name}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-mono text-gray-700">
                        {emp.salaryDetails?.isDailyRated 
                          ? `₹${stats.dailyRate.toFixed(2)}/day` 
                          : `₹${emp.salaryDetails?.baseSalary?.toLocaleString()}/mo`}
                      </div>
                      {!emp.salaryDetails?.isDailyRated && (
                        <div className="text-[10px] text-gray-400">Rate: {stats.dailyRate.toFixed(2)}</div>
                      )}
                    </td>
                    <td className="p-4 text-center font-medium text-gray-700">
                      {stats.totalPaidDays}
                    </td>
                    <td className="p-4 text-right font-bold text-gray-800">
                      ₹{Math.round(stats.grossSalary).toLocaleString()}
                    </td>
                    <td className="p-4 text-right text-red-600 font-medium">
                      -₹{stats.totalDeductions.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-bold text-green-700 text-base">
                      ₹{Math.round(stats.finalNet).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => toggleSalaryStatus(emp.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          status.status === 'Paid' 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'bg-red-100 text-red-700 border-red-200'
                        }`}
                      >
                        {status.status}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => { setEditingEmployee(emp); setShowEditModal(true); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Payroll Details"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400">
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditPayrollModal 
        isOpen={showEditModal} 
        employee={editingEmployee} 
        onClose={() => setShowEditModal(false)} 
        onSave={handleSaveEmployee} 
      />
    </div>
  );
};

export default PayrollTab;
