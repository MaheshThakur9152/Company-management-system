import React, { useState, useEffect } from 'react';
import { X, Download, FileText, FileType, Plus, Trash2, Calendar } from 'lucide-react';
import { Employee, AttendanceRecord, Site } from '../types';
import { generateBillExcel } from '../utils/excelGenerator';

interface GenerateBillModalProps {
    isOpen: boolean;
    onClose: () => void;
    employees: Employee[];
    attendanceData: AttendanceRecord[];
    sites: Site[]; // To select site
}

const GenerateBillModal: React.FC<GenerateBillModalProps> = ({ isOpen, onClose, employees, attendanceData, sites }) => {
    const [selectedSiteId, setSelectedSiteId] = useState<string>('');
    const [companyName, setCompanyName] = useState('AMBE SERVICE FACILITIES PRIVATE LIMITED');
    const [invoiceType, setInvoiceType] = useState('TAX INVOICE');
    const [invoiceNo, setInvoiceNo] = useState('ASF/P/25-26/023');
    const [date, setDate] = useState(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
    const [billingPeriod, setBillingPeriod] = useState('1st to 31st October 2025');
    const [workOrderNo, setWorkOrderNo] = useState('LMCHS/VBP/24/24-25');
    const [workOrderDate, setWorkOrderDate] = useState('10-10-2025');
    const [workOrderPeriod, setWorkOrderPeriod] = useState('01/09/2025-31/03/2026');

    const [items, setItems] = useState<any[]>([]);
    const [managementRate, setManagementRate] = useState(5);
    const [cgstRate, setCgstRate] = useState(9);
    const [sgstRate, setSgstRate] = useState(9);

    // Additional Details
    const [bankName, setBankName] = useState('Axis bank');
    const [accNo, setAccNo] = useState('924020001871570');
    const [ifsc, setIfsc] = useState('UTIB0001572');
    const [branch, setBranch] = useState('kandivali west,Link Road.');
    const [terms, setTerms] = useState('Terms & condition : \nPayment can only be done in cheque/DD, NEFT, RTGS ');
    const [signatory, setSignatory] = useState('For Ambe Service Facilities Pvt Ltd  \n\n\n\n\nAuthorized signatory\n');
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        if (isOpen && sites.length > 0 && !selectedSiteId) {
            setSelectedSiteId(sites[0].id);
        }
    }, [isOpen, sites]);

    useEffect(() => {
        if (selectedSiteId) {
            calculateItems();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSiteId]);

    const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.value) return;
        const d = new Date(e.target.value);
        setDate(d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
    };

    const handleMonthSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.value) return;
        const [year, month] = e.target.value.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const monthName = startDate.toLocaleDateString('en-GB', { month: 'long' });
        const endDay = endDate.getDate();
        
        const getOrdinal = (n: number) => {
            const s = ["th", "st", "nd", "rd"];
            const v = n % 100;
            return n + (s[(v - 20) % 10] || s[v] || s[0]);
        };

        setBillingPeriod(`1st to ${getOrdinal(endDay)} ${monthName} ${year}`);
    };

    const calculateItems = () => {
        // Filter employees for the selected site
        // Note: In mockData, siteId might be 's1', 's2'.
        const siteEmployees = employees.filter(e => e.siteId === selectedSiteId);
        const site = sites.find(s => s.id === selectedSiteId);
        const siteRate = site?.billingRate || 0;

        // Group by Role (e.g., 'Lift Operator' -> mapped from 'Janitor' or 'Key Supervisor')
        // For now, let's map 'Janitor' to 'Lift Operator' as per the PDF example
        // And 'Key Supervisor' to 'Key Supervisor'

        const roleMap: Record<string, { count: number, days: number, rate: number, hsn: string }> = {};

        siteEmployees.forEach(emp => {
            const empRecords = attendanceData.filter(r => r.employeeId === emp.id);

            // Calculate working days for this employee
            // Logic: P = 1, HD = 0.5, WO = 1 (assuming paid WO), A = 0
            // We need to check the month. Assuming current month data is passed.
            let days = 0;
            empRecords.forEach(r => {
                if (r.status === 'P') days += 1;
                else if (r.status === 'HD') days += 0.5;
                else if (r.status === 'W/O') days += 1;
            });

            // If no records, maybe check if they are active and calculate based on calendar?
            // For now, use the records.

            // Map Role
            let billRole = emp.role === 'Janitor' ? 'Lift Operator' : emp.role;

            if (!roleMap[billRole]) {
                roleMap[billRole] = {
                    count: 0,
                    days: 0,
                    rate: siteRate > 0 ? siteRate : (billRole === 'Lift Operator' ? 25630 : 25000), // Use site rate if available, else default
                    hsn: '9985'
                };
            }

            roleMap[billRole].count += 1;
            roleMap[billRole].days += days;
        });

        const newItems = Object.keys(roleMap).map(role => {
            const data = roleMap[role];
            // Formula: Amount = Working Days * (Rate / 31)
            // Note: The PDF example had 317.5 days for 12 persons.
            // 317.5 * (25630/31) = 262500.80
            const amount = data.days * (data.rate / 31);

            return {
                description: role,
                hsn: data.hsn,
                rate: data.rate,
                workingDays: data.days,
                persons: data.count,
                amount: amount
            };
        });

        // Add Overtime Item (Placeholder)
        newItems.push({
            description: 'Overtime in hours',
            hsn: '9985',
            rate: 25630, // Same rate?
            workingDays: 0, // Hours actually
            persons: 0,
            amount: 0
        });

        setItems(newItems);
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Recalculate amount
        if (field === 'rate' || field === 'workingDays') {
            // Special logic for Overtime?
            // PDF: Overtime Amount = Hours * (Rate / 31 / 8)? Or just Rate * Hours?
            // The analysis says: Formula=E17*(D16/31/9) for OT. (Rate / 31 / 9 hours shift?)
            // Let's assume standard formula for roles, and special for OT.

            const item = newItems[index];
            if (item.description.toLowerCase().includes('overtime')) {
                // Assuming 9 hour shift as per analysis
                item.amount = item.workingDays * (item.rate / 31 / 9); // workingDays here is Hours
            } else {
                item.amount = item.workingDays * (item.rate / 31);
            }
        }

        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, {
            description: '',
            hsn: '9985',
            rate: 0,
            workingDays: 0,
            persons: 0,
            amount: 0
        }]);
    };

    const deleteItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleGenerate = async () => {
        const site = sites.find(s => s.id === selectedSiteId);
        if (!site) return;

        const params = {
            site,
            companyName,
            invoiceType,
            invoiceNo,
            date,
            billingPeriod,
            workOrderNo,
            workOrderDate,
            workOrderPeriod,
            items,
            managementRate,
            cgstRate,
            sgstRate,
            bankDetails: {
                name: bankName,
                accNo,
                ifsc,
                branch
            },
            terms,
            signatory
        };

        try {
            await generateBillExcel(params);
        } catch (error) {
            console.error("Failed to generate bill:", error);
            alert("Failed to generate bill. Please try again.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-800">Generate Bill</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Header Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Company Name</label>
                            <select
                                value={companyName}
                                onChange={e => setCompanyName(e.target.value)}
                                className="w-full p-2 border rounded-lg text-sm"
                            >
                                <option value="AMBE SERVICE FACILITIES PRIVATE LIMITED">AMBE SERVICE FACILITIES PRIVATE LIMITED</option>
                                <option value="AMBE SERVICES">AMBE SERVICES</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Invoice Type</label>
                            <select
                                value={invoiceType}
                                onChange={e => setInvoiceType(e.target.value)}
                                className="w-full p-2 border rounded-lg text-sm"
                            >
                                <option value="TAX INVOICE">TAX INVOICE</option>
                                <option value="PROFORMA INVOICE">PROFORMA INVOICE</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Select Site</label>
                            <select
                                value={selectedSiteId}
                                onChange={e => setSelectedSiteId(e.target.value)}
                                className="w-full p-2 border rounded-lg text-sm"
                            >
                                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Invoice No</label>
                            <input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                            <div className="relative">
                                <input value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded-lg text-sm pr-10" />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6">
                                    <input 
                                        type="date" 
                                        onChange={handleDateSelect}
                                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                    />
                                    <Calendar size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Billing Period</label>
                            <div className="relative">
                                <input value={billingPeriod} onChange={e => setBillingPeriod(e.target.value)} className="w-full p-2 border rounded-lg text-sm pr-10" />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6">
                                    <input 
                                        type="month" 
                                        onChange={handleMonthSelect}
                                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                    />
                                    <Calendar size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Work Order No</label>
                            <input value={workOrderNo} onChange={e => setWorkOrderNo(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Work Order Period</label>
                            <input value={workOrderPeriod} onChange={e => setWorkOrderPeriod(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <h3 className="font-bold text-gray-700 mb-2">Bill Items</h3>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                                    <tr>
                                        <th className="p-3">Description</th>
                                        <th className="p-3 w-20">HSN</th>
                                        <th className="p-3 w-24">Rate</th>
                                        <th className="p-3 w-24">Days/Hrs</th>
                                        <th className="p-3 w-20">Persons</th>
                                        <th className="p-3 w-32 text-right">Amount</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="p-2"><input value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} className="w-full p-1 border rounded" /></td>
                                            <td className="p-2"><input value={item.hsn} onChange={e => handleItemChange(idx, 'hsn', e.target.value)} className="w-full p-1 border rounded" /></td>
                                            <td className="p-2"><input type="number" value={item.rate} onChange={e => handleItemChange(idx, 'rate', parseFloat(e.target.value))} className="w-full p-1 border rounded" /></td>
                                            <td className="p-2"><input type="number" value={item.workingDays} onChange={e => handleItemChange(idx, 'workingDays', parseFloat(e.target.value))} className="w-full p-1 border rounded" /></td>
                                            <td className="p-2"><input type="number" value={item.persons} onChange={e => handleItemChange(idx, 'persons', parseFloat(e.target.value))} className="w-full p-1 border rounded" /></td>
                                            <td className="p-2 text-right font-mono">{item.amount.toFixed(2)}</td>
                                            <td className="p-2 text-center">
                                                <button onClick={() => deleteItem(idx)} className="text-red-500 hover:text-red-700 p-1">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-2">
                            <button
                                onClick={addItem}
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                <Plus size={16} /> Add Item
                            </button>
                        </div>
                    </div>

                    {/* Taxes */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Mgmt Rate (%)</label>
                            <input type="number" value={managementRate} onChange={e => setManagementRate(parseFloat(e.target.value))} className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">CGST Rate (%)</label>
                            <input type="number" value={cgstRate} onChange={e => setCgstRate(parseFloat(e.target.value))} className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">SGST Rate (%)</label>
                            <input type="number" value={sgstRate} onChange={e => setSgstRate(parseFloat(e.target.value))} className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                    </div>

                    {/* Advanced Details Toggle */}
                    <div>
                        <button 
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                            {showAdvanced ? 'Hide' : 'Show'} Additional Details (Bank, Terms, Signatory)
                        </button>
                    </div>

                    {/* Advanced Details Section */}
                    {showAdvanced && (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Bank Name</label>
                                    <input value={bankName} onChange={e => setBankName(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Account No</label>
                                    <input value={accNo} onChange={e => setAccNo(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">IFSC Code</label>
                                    <input value={ifsc} onChange={e => setIfsc(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Branch</label>
                                    <input value={branch} onChange={e => setBranch(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Terms & Conditions</label>
                                <textarea 
                                    value={terms} 
                                    onChange={e => setTerms(e.target.value)} 
                                    className="w-full p-2 border rounded-lg text-sm h-20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Signatory Text</label>
                                <textarea 
                                    value={signatory} 
                                    onChange={e => setSignatory(e.target.value)} 
                                    className="w-full p-2 border rounded-lg text-sm h-20"
                                />
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            onClick={handleGenerate}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                        >
                            <FileText size={20} /> Generate Excel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GenerateBillModal;
