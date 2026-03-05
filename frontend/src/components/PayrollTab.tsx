import React, { useState } from 'react';
import { Employee, AttendanceRecord, Site, SalaryRecord } from '@types';
import { Download, Filter, Edit2, DollarSign, CheckCircle, XCircle, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import EditPayrollModal from './EditPayrollModal';
import ManageDeductionModal from './ManageDeductionModal';
import { updateEmployee, getEmployees, getSalaryRecords, updateSalaryRecord } from '@services/mockData';
import { computeWorkingDaysForEmployee, getDaysInMonth } from '@utils/employeeUtils';
import { isEmployeeActiveForMonth } from '@utils/employeeUtils';

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

  // Deduction Modal State
  const [deductionEmployee, setDeductionEmployee] = useState<Employee | null>(null);
  const [showDeductionModal, setShowDeductionModal] = useState(false);

  const [localEmployees, setLocalEmployees] = useState<Employee[]>(employees);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  
  // Paid Days Edit State
  const [editingPaidDays, setEditingPaidDays] = useState<{ empId: string, value: string } | null>(null);

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

  const handlePaidDaysUpdate = async (empId: string, days: number) => {
    const emp = localEmployees.find(e => e.id === empId);
    if (!emp) return;

    const current = getSalaryStatus(empId);
    
    // Calculate new stats with overridden days
    const stats = calculatePayroll(emp, days);
    
    let deductionBreakdown = stats.breakdown.deductions;
    let allowancesBreakdown = stats.breakdown.allowances;

    if (current.record && current.record.breakdown) {
       // Keep existing deductions/allowances if they exist in record
       deductionBreakdown = current.record.breakdown.deductions || deductionBreakdown;
       allowancesBreakdown = current.record.breakdown.allowances || allowancesBreakdown;
    }
    
    // Recalculate totals based on saved deductions/allowances but NEW gross
    const totalDeductions = Object.values(deductionBreakdown || {}).reduce((a: any, b: any) => a + b, 0) as number;
    const allowancesObj = allowancesBreakdown || {};
    const totalAllowances = (allowancesObj.travelling || 0) + (allowancesObj.others || 0);

    const newGross = stats.grossSalary;
    const newNet = Math.max(0, newGross - totalDeductions + totalAllowances);
    
    const recordId = current.record?.id || `${empId}_${selectedMonth}_${selectedYear}`;
    
    const record: SalaryRecord = {
      id: recordId,
      employeeId: empId,
      month: selectedMonth,
      year: selectedYear,
      netSalary: newNet,
      grossSalary: newGross,
      totalDeductions: totalDeductions,
      manualPaidDays: days,
      breakdown: {
        deductions: deductionBreakdown,
        allowances: allowancesBreakdown
      },
      status: current.status as any, 
      complianceStatus: current.compliance,
      paymentDate: current.record?.paymentDate
    };

    await updateSalaryRecord(record);
    
    const allRecords = await getSalaryRecords();
    setSalaryRecords(allRecords);
    setEditingPaidDays(null);
  };

  const filteredEmployees = localEmployees.filter(e => {
    const matchesSite = selectedSiteFilter === 'all' || e.siteId === selectedSiteFilter;
    const isVisible = isEmployeeActiveForMonth(e, selectedMonth, selectedYear);
    return matchesSite && isVisible;
  });

  const calculatePayroll = (emp: Employee, manualDaysOverride?: number) => {
    const empRecords = attendanceData.filter(r => {
      const d = new Date(r.date);
      return r.employeeId === emp.id && d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });

    // Compute working days using the shared rule helper
    // Payroll logic: Pass isPayroll=true to EXCLUDE standard WeekOffs from paid days (unless marked P/PH)
    const { workingDays: calculatedWorkingDays } = computeWorkingDaysForEmployee(empRecords, emp, selectedMonth, selectedYear, true);
    const workingDays = manualDaysOverride !== undefined ? manualDaysOverride : calculatedWorkingDays;

    const totalOTHours = empRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

    const salaryDetails = emp.salaryDetails || {};
    const baseSalary = salaryDetails.baseSalary || 0;
    const isDailyRated = salaryDetails.isDailyRated || false;
    const dailyRateOverride = salaryDetails.dailyRateOverride || 0;

    let dailyRate = 0;
    if (isDailyRated) {
      dailyRate = dailyRateOverride;
    } else {
      const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
      dailyRate = Math.floor(baseSalary / daysInMonth);
    }
    const hourlyRate = dailyRate / 9;

    const daysAmount = workingDays * dailyRate;
    const otAmount = totalOTHours * hourlyRate;
    const grossSalary = daysAmount + otAmount;

    const ded = salaryDetails.deductionBreakdown || {};
    const totalDeductions = (ded.advance || 0) + (ded.uniform || 0) + (ded.shoes || 0) + (ded.idCard || 0) + (ded.cbre || 0) + (ded.others || 0);

    const netBeforeAllowances = grossSalary - totalDeductions;
    const allowances = (salaryDetails.allowancesBreakdown?.travelling || 0) + (salaryDetails.allowancesBreakdown?.others || 0);
    const finalNet = Math.max(0, netBeforeAllowances + allowances);

    return {
      dailyRate,
      totalPaidDays: workingDays,
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

  const handleDeductionSave = async (deductionBreakdown: any) => {
    if (!deductionEmployee) return;

    const empId = deductionEmployee.id;
    const current = getSalaryStatus(empId);

    const totalDeductions = Object.values(deductionBreakdown).reduce((a: any, b: any) => a + b, 0) as number;

    let stats;
    if (current.record && current.record.breakdown) {
      const gross = current.record.grossSalary || 0;
      const allowancesObj = current.record.breakdown.allowances || {};
      const totalAllowances = (allowancesObj.travelling || 0) + (allowancesObj.others || 0);

      stats = {
        grossSalary: gross,
        totalDeductions: totalDeductions,
        finalNet: gross - totalDeductions + totalAllowances,
        manualPaidDays: current.record.manualPaidDays,
        breakdown: {
          ...current.record.breakdown,
          deductions: deductionBreakdown
        }
      };
    } else {
      const calc = calculatePayroll(deductionEmployee);
      const allowancesObj = calc.breakdown.allowances || {};
      const totalAllowances = (allowancesObj.travelling || 0) + (allowancesObj.others || 0);

      stats = {
        grossSalary: calc.grossSalary,
        totalDeductions: totalDeductions,
        finalNet: calc.grossSalary - totalDeductions + totalAllowances,
        breakdown: {
          deductions: deductionBreakdown,
          allowances: allowancesObj
        }
      };
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
      manualPaidDays: stats.manualPaidDays,
      breakdown: stats.breakdown,
      status: current.status as any,
      complianceStatus: current.compliance,
      paymentDate: current.record?.paymentDate
    };

    await updateSalaryRecord(record);

    const allRecords = await getSalaryRecords();
    setSalaryRecords(allRecords);
    setShowDeductionModal(false);
    setDeductionEmployee(null);
  };

  const toggleSalaryStatus = async (empId: string) => {
    const emp = localEmployees.find(e => e.id === empId);
    if (!emp) return;

    const current = getSalaryStatus(empId);
    const newStatus = current.status === 'Paid' ? 'Unpaid' : 'Paid';

    let stats;
    // We determine what values to save based on whether a record exists (custom/saved) or default
    if (current.record && current.record.breakdown) {
      stats = {
        id: current.record.id,
        finalNet: current.record.netSalary,
        grossSalary: current.record.grossSalary || 0,
        totalDeductions: current.record.totalDeductions || 0,
        manualPaidDays: current.record.manualPaidDays,
        breakdown: current.record.breakdown
      };
    } else {
      const calc = calculatePayroll(emp);
      stats = {
        id: `${empId}_${selectedMonth}_${selectedYear}`,
        finalNet: calc.finalNet,
        grossSalary: calc.grossSalary,
        totalDeductions: calc.totalDeductions,
        breakdown: calc.breakdown
      };
    }

    const recordId = stats.id || `${empId}_${selectedMonth}_${selectedYear}`;
    const record: SalaryRecord = {
      id: recordId,
      employeeId: empId,
      month: selectedMonth,
      year: selectedYear,
      netSalary: stats.finalNet,
      grossSalary: stats.grossSalary,
      totalDeductions: stats.totalDeductions,
      manualPaidDays: stats.manualPaidDays,
      breakdown: stats.breakdown,
      status: newStatus,
      complianceStatus: current.compliance,
      paymentDate: newStatus === 'Paid' ? new Date().toISOString() : undefined
    };

    await updateSalaryRecord(record);

    // --- HANDLE ADVANCE BALANCE UPDATE ---
    if (newStatus === 'Paid') {
      const appliedAdvance = stats.breakdown?.deductions?.advance || 0;
      if (appliedAdvance > 0) {
        const updatedEmp = { ...emp };
        const currentProfileAdvance = updatedEmp.salaryDetails?.deductionBreakdown?.advance || 0;
        const newProfileAdvance = Math.max(0, currentProfileAdvance - appliedAdvance);

        if (!updatedEmp.salaryDetails) updatedEmp.salaryDetails = {};
        if (!updatedEmp.salaryDetails.deductionBreakdown) updatedEmp.salaryDetails.deductionBreakdown = {};

        updatedEmp.salaryDetails.deductionBreakdown.advance = newProfileAdvance;
        await updateEmployee(updatedEmp);
      }
    } else {
      // Reverting to Unpaid -> Refund the advance back
      const appliedAdvance = stats.breakdown?.deductions?.advance || 0;
      if (appliedAdvance > 0) {
        const updatedEmp = { ...emp };
        const currentProfileAdvance = updatedEmp.salaryDetails?.deductionBreakdown?.advance || 0;

        if (!updatedEmp.salaryDetails) updatedEmp.salaryDetails = {};
        if (!updatedEmp.salaryDetails.deductionBreakdown) updatedEmp.salaryDetails.deductionBreakdown = {};

        updatedEmp.salaryDetails.deductionBreakdown.advance = currentProfileAdvance + appliedAdvance;
        await updateEmployee(updatedEmp);
      }
    }

    // Refresh employee list to reflect advance changes
    const allEmps = await getEmployees();
    setLocalEmployees(allEmps);

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
          manualPaidDays: current.record.manualPaidDays,
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
        manualPaidDays: stats.manualPaidDays,
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
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('default', { month: 'short' })}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(parseInt(e.target.value))}
              className="bg-transparent text-sm outline-none font-medium text-gray-700 cursor-pointer border-l pl-2"
            >
              {[2024, 2025, 2026, 2027].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
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
                // Use manualPaidDays from record if available
                const manualDays = status.record?.manualPaidDays;

                let stats;

                // If we have a historical record with breakdown, use it for financial values
                if (status.record && status.record.breakdown) {
                  const currentCalc = calculatePayroll(emp, manualDays); // Pass manual override
                  stats = {
                    ...currentCalc,
                    grossSalary: status.record.grossSalary || currentCalc.grossSalary,
                    totalDeductions: status.record.totalDeductions || currentCalc.totalDeductions,
                    finalNet: status.record.netSalary
                  };
                  if (manualDays !== undefined) {
                    stats.totalPaidDays = manualDays;
                  }
                } else {
                  stats = calculatePayroll(emp, manualDays);
                }

                const isSelected = selectedEmployeeIds.includes(emp.id);
                const isEditingDays = editingPaidDays?.empId === emp.id;

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
                          ? `₹${(stats.dailyRate || 0).toFixed(2)}/day`
                          : `₹${(emp.salaryDetails?.baseSalary || 0).toLocaleString()}/mo`}
                      </div>
                      {!emp.salaryDetails?.isDailyRated && (
                        <div className="text-[10px] text-gray-400">Rate: {(stats.dailyRate || 0).toFixed(2)}</div>
                      )}
                    </td>
                    <td 
                      className="p-4 text-center font-medium text-gray-700 cursor-pointer relative group"
                      onClick={() => !isEditingDays && setEditingPaidDays({ empId: emp.id, value: stats.totalPaidDays.toString() })}
                    >
                      {isEditingDays ? (
                         <input
                           type="number"
                           step="0.5"
                           className="w-20 p-1 border border-blue-500 rounded text-center outline-none shadow-sm"
                           value={editingPaidDays.value}
                           autoFocus
                           onChange={(e) => setEditingPaidDays({ ...editingPaidDays, value: e.target.value })}
                           onBlur={() => {
                               const val = parseFloat(editingPaidDays.value);
                               if (!isNaN(val)) handlePaidDaysUpdate(emp.id, val);
                               else setEditingPaidDays(null);
                           }}
                           onKeyDown={(e) => {
                               if (e.key === 'Enter') {
                                   const val = parseFloat(editingPaidDays.value);
                                   if (!isNaN(val)) handlePaidDaysUpdate(emp.id, val);
                                   else setEditingPaidDays(null);
                               }
                           }}
                           onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                           <span>{stats.totalPaidDays}</span>
                           <Edit2 size={12} className="opacity-0 group-hover:opacity-100 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right font-bold text-gray-800">
                      ₹{Math.round(stats.grossSalary || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeductionEmployee(emp); setShowDeductionModal(true); }}
                        className="text-red-600 font-medium hover:underline hover:text-red-800 decoration-dotted underline-offset-4"
                        title="Click to Manage Deductions"
                      >
                        -₹{(stats.totalDeductions || 0).toLocaleString()}
                      </button>
                    </td>
                    <td className="p-4 text-right font-bold text-green-700 text-base">
                      ₹{Math.round(stats.finalNet || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleSalaryStatus(emp.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${status.status === 'Paid'
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

      {/* MANAGE DEDUCTION MODAL */}
      <ManageDeductionModal
        isOpen={showDeductionModal}
        employee={deductionEmployee}
        currentSalaryRecord={deductionEmployee ? getSalaryStatus(deductionEmployee.id).record : undefined}
        calculatedDeductions={deductionEmployee ? calculatePayroll(deductionEmployee).breakdown.deductions : {}}
        onClose={() => { setShowDeductionModal(false); setDeductionEmployee(null); }}
        onSave={handleDeductionSave}
      />
    </div>
  );
};

export default PayrollTab;
