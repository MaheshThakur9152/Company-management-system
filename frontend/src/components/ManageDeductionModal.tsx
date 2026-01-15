import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, IndianRupee } from 'lucide-react';
import { Employee, SalaryRecord } from '@types';

interface ManageDeductionModalProps {
    isOpen: boolean;
    employee: Employee | null;
    currentSalaryRecord: SalaryRecord | undefined; // Existing record for this month if any
    calculatedDeductions: any; // What the system calculated as default (from employee profile)
    onClose: () => void;
    onSave: (deductionBreakdown: any) => void;
}

const ManageDeductionModal: React.FC<ManageDeductionModalProps> = ({
    isOpen,
    employee,
    currentSalaryRecord,
    calculatedDeductions,
    onClose,
    onSave
}) => {
    const [breakdown, setBreakdown] = useState<any>({});

    useEffect(() => {
        if (isOpen && employee) {
            // Priority: 1. Existing Salary Record for this month, 2. Default Calculator (Profile)
            const source = currentSalaryRecord && currentSalaryRecord.breakdown?.deductions
                ? currentSalaryRecord.breakdown.deductions
                : calculatedDeductions;

            setBreakdown({
                advance: source.advance || 0,
                uniform: source.uniform || 0,
                shoes: source.shoes || 0,
                idCard: source.idCard || 0,
                cbre: source.cbre || 0,
                others: source.others || 0
            });
        }
    }, [isOpen, employee, currentSalaryRecord, calculatedDeductions]);

    if (!isOpen || !employee) return null;

    const handleInputChange = (field: string, value: string) => {
        const numVal = parseFloat(value) || 0;
        setBreakdown((prev: any) => ({ ...prev, [field]: numVal }));
    };

    const totalDeduction = Object.values(breakdown).reduce((a: any, b: any) => a + b, 0) as number;

    // Max limits (Total available in profile)
    // Note: Only Advance is typically a "Balance" that decreases. 
    // Others like Uniform/Shoes might be one-time charges for that month or existing balances.
    // For simplicity, we show what's in the profile as "Total Pending" reference for Advance.
    const profileAdvance = employee.salaryDetails?.deductionBreakdown?.advance || 0;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-red-600 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                        <IndianRupee size={20} /> Manage Deductions
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="text-sm text-gray-500 mb-4">
                        Adjust the deductions for <strong>{employee.name}</strong> for this month.
                        Modifying these values will override the default calculation.
                    </div>

                    {/* ADVANCE SPECIAL HANDLING */}
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mb-4">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-orange-800 uppercase">Advance Repayment</label>
                            <span className="text-xs text-orange-600 font-medium">Total Pending: ₹{profileAdvance}</span>
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                            <input
                                type="number"
                                value={breakdown.advance}
                                onChange={(e) => handleInputChange('advance', e.target.value)}
                                className="w-full pl-6 pr-3 py-2 border border-orange-200 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                            />
                        </div>
                        {breakdown.advance < profileAdvance && (
                            <div className="text-[10px] text-orange-600 mt-1 flex items-center gap-1">
                                <AlertTriangle size={10} /> Remaining ₹{profileAdvance - breakdown.advance} will carry forward.
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {['uniform', 'shoes', 'idCard', 'cbre', 'others'].map(field => (
                            <div key={field}>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    {field.replace(/([A-Z])/g, ' $1').trim()}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                                    <input
                                        type="number"
                                        value={breakdown[field]}
                                        onChange={(e) => handleInputChange(field, e.target.value)}
                                        className="w-full pl-5 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t flex justify-between items-center">
                        <div className="text-sm font-bold text-gray-700">Total Deduction</div>
                        <div className="text-xl font-bold text-red-600">₹{totalDeduction}</div>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">Cancel</button>
                    <button onClick={() => onSave(breakdown)} className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 shadow-sm">
                        Confirm Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageDeductionModal;
