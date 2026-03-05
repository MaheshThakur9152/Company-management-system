import React, { useState, useEffect, useRef } from 'react';
import { X, Download, FileText, Plus, Trash2, Calendar } from 'lucide-react';
import { Employee, AttendanceRecord, Site, Invoice } from '@types';
import { generateBillExcel } from '@utils/excelGenerator';
import { computeWorkingDaysForEmployee, getDaysInMonth } from '@utils/employeeUtils';

interface GenerateBillModalProps {
    isOpen: boolean;
    onClose: () => void;
    employees: Employee[];
    attendanceData: AttendanceRecord[];
    sites: Site[]; // To select site
    selectedMonth: number; // 1-based
    selectedYear: number;
    onSave?: (invoice: Invoice) => void;
}

const GenerateBillModal: React.FC<GenerateBillModalProps> = ({ isOpen, onClose, employees, attendanceData, sites, selectedMonth, selectedYear, onSave }) => {
    const [selectedSiteId, setSelectedSiteId] = useState<string>('');
    const [companyName, setCompanyName] = useState('AMBE SERVICE');
    const [invoiceType, setInvoiceType] = useState('TAX INVOICE');
    const [invoiceNo, setInvoiceNo] = useState('ASF/P/25-26/023');
    const [date, setDate] = useState(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
    const [billingPeriod, setBillingPeriod] = useState('1st to 31st October 2025');
    const [workOrderNo, setWorkOrderNo] = useState('LMCHS/VBP/24/24-25');
    const [workOrderDate, setWorkOrderDate] = useState('10-10-2025');
    const [workOrderPeriod, setWorkOrderPeriod] = useState('01/09/2025-31/03/2026');

    const [items, setItems] = useState<any[]>([]);
    const [managementRate, setManagementRate] = useState(15);
    const [cgstRate, setCgstRate] = useState(9);
    const [sgstRate, setSgstRate] = useState(9);

    // PDF upload & parse POC states
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [parsing, setParsing] = useState(false);
    const [parseResult, setParseResult] = useState<any | null>(null);

    const handleUploadAndParse = async () => {
        if (!uploadFile || !selectedSiteId) return alert('Select site and upload a PDF first');
        setParsing(true);
        try {
            const fd = new FormData();
            fd.append('file', uploadFile as Blob);
            fd.append('siteId', selectedSiteId);
            const res = await fetch('/api/invoices/parse', { method: 'POST', body: fd });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || json.msg || 'Parse failed');
            setParseResult(json);
            // optionally auto-populate items here or let user accept
        } catch (err: any) {
            console.error('Parse error', err);
            alert('Failed to parse PDF: ' + (err.message || err));
        } finally {
            setParsing(false);
        }
    };

    // Additional Details
    const [bankName, setBankName] = useState('Axis bank');
    const [accNo, setAccNo] = useState('924020001871570');
    const [ifsc, setIfsc] = useState('UTIB0001572');
    const [branch, setBranch] = useState('kandivali west,Link Road.');
    const [terms, setTerms] = useState('Terms & condition : \nPayment can only be done in cheque/DD, NEFT, RTGS ');
    const [signatory, setSignatory] = useState('For Ambe Service Facilities Pvt Ltd  \n\n\n\n\nAuthorized signatory\n');
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Auto-update bank details based on selected vendor company
    useEffect(() => {
        const normalized = (companyName || '').trim().toUpperCase();
        if (normalized === 'AMBE SERVICE FACILITIES PRIVATE LIMITED') {
            setBankName('Axis bank');
            setAccNo('924020001871570');
            setIfsc('UTIB0001572');
            setBranch('kandivali west,Link Road.');
            setTerms('Terms & condition : \nPayment can only be done in cheque/DD, NEFT, RTGS');
            setSignatory('For Ambe Service Facilities Pvt Ltd  \n\n\n\n\nAuthorized signatory\n');
        } else {
            setBankName('Union Bank of India');
            setAccNo('510101006571089');
            setIfsc('UBIN0903302');
            setBranch('kandivali west');
            setTerms('Terms & condition : \nPayment should not be done in Cash');
            setSignatory('For Ambe Service  \n\n\n\n\nAuthorized signatory\n');
        }
    }, [companyName]);

    const lastLoadedSignature = useRef<string>('');

    // Reset signature on close to ensure fresh load on open
    useEffect(() => {
        if (!isOpen) lastLoadedSignature.current = '';
    }, [isOpen]);

    // Sync company name from site data
    useEffect(() => {
        if (isOpen && sites.length > 0) {
            const currentSiteId = selectedSiteId || sites[0].id;
            if (!selectedSiteId) {
                setSelectedSiteId(currentSiteId);
            }

            const site = sites.find(s => s.id === currentSiteId);
            // Create a signature that represents the source of truth for this site
            const currentSignature = site ? `${site.id}|${site.companyName || ''}` : `${currentSiteId}|DEFAULT`;

            // Only update if the source has changed (site switch, site edit, or fresh open)
            if (currentSignature !== lastLoadedSignature.current) {
                lastLoadedSignature.current = currentSignature;
                if (site && site.companyName) {
                    setCompanyName(site.companyName);
                } else {
                    setCompanyName('AMBE SERVICE');
                }
            }
        }
    }, [isOpen, selectedSiteId, sites]);

    useEffect(() => {
        if (isOpen) {
            const startDate = new Date(selectedYear, selectedMonth - 1, 1);
            const endDate = new Date(selectedYear, selectedMonth, 0);
            const monthName = startDate.toLocaleDateString('en-GB', { month: 'long' });
            const endDay = endDate.getDate();
            const getOrdinal = (n: number) => {
                const s = ["th", "st", "nd", "rd"];
                const v = n % 100;
                return n + (s[(v - 20) % 10] || s[v] || s[0]);
            };
            setBillingPeriod(`1st to ${getOrdinal(endDay)} ${monthName} ${selectedYear}`);

            // Update invoice number year based on financial year
            const fyStart = selectedMonth >= 4 ? selectedYear : selectedYear - 1;
            const fyEnd = fyStart + 1;
            const fyStr = `${fyStart.toString().slice(-2)}-${fyEnd.toString().slice(-2)}`;
            setInvoiceNo(`ASF/P/${fyStr}/001`);

            // Update work order period if it's default
            setWorkOrderPeriod(`01/04/${fyStart}-31/03/${fyEnd}`);
        }
    }, [isOpen, selectedMonth, selectedYear]);

    useEffect(() => {
        if (selectedSiteId) {
            const site = sites.find(s => s.id === selectedSiteId);
            if (site) {
                if (site.managementRate !== undefined && site.managementRate !== null) {
                    setManagementRate(site.managementRate);
                }
            }
            calculateItems();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSiteId, attendanceData, employees, selectedMonth, selectedYear]);

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
        const siteEmployees = employees.filter(e => e.siteId === selectedSiteId);
        const site = sites.find(s => s.id === selectedSiteId);
        const siteRate = site?.billingRate || 0;

        const roleMap: Record<string, { count: number, days: number, rate: number, hsn: string }> = {};

        siteEmployees.forEach(emp => {
            const empRecords = attendanceData.filter(r => r.employeeId === emp.id);
            const { workingDays } = computeWorkingDaysForEmployee(empRecords, emp, selectedMonth, selectedYear);

            let billRole = emp.role === 'Janitor' ? 'Lift Operator' : emp.role;

            if (!roleMap[billRole]) {
                roleMap[billRole] = {
                    count: 0,
                    days: 0,
                    rate: siteRate > 0 ? siteRate : (billRole === 'Lift Operator' ? 25630 : 25000),
                    hsn: '9985'
                };
            }

            roleMap[billRole].count += 1;
            roleMap[billRole].days += workingDays;
        });

        const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);

        const newItems = Object.keys(roleMap).map(role => {
            const data = roleMap[role];
            const amount = data.days * (data.rate / daysInMonth);

            return {
                description: role,
                hsn: data.hsn,
                rate: data.rate,
                workingDays: data.days,
                persons: data.count,
                amount: amount
            };
        });

        newItems.push({
            description: 'Overtime in hours',
            hsn: '9985',
            rate: 25630,
            workingDays: 0,
            persons: 0,
            amount: 0
        });

        setItems(newItems);
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        if (field === 'rate' || field === 'workingDays') {
            const item = newItems[index];
            const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
            if (item.description.toLowerCase().includes('overtime')) {
                item.amount = item.workingDays * (item.rate / daysInMonth / 9);
            } else {
                item.amount = item.workingDays * (item.rate / daysInMonth);
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
            signatory,
            // Pass days info to downstream generators if needed
            daysInMonth: getDaysInMonth(selectedMonth, selectedYear),
            // Enable detailed debug information when running in dev mode
            // (consumed by the generator to add a debug worksheet and extra logs)
            debug: import.meta.env.DEV
        };

        try {
            console.debug('[GenerateBillModal] Generating with params:', JSON.parse(JSON.stringify(params)));
            await generateBillExcel(params);

            if (onSave) {
                // Calculate totals for Invoice object
                const subTotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                const managementAmount = subTotal * (managementRate / 100);
                const taxable = subTotal + managementAmount;
                const cgst = taxable * (cgstRate / 100);
                const sgst = taxable * (sgstRate / 100);
                const total = taxable + cgst + sgst;

                const newInvoice: Invoice = {
                    id: Date.now().toString() + Math.random(),
                    invoiceNo: invoiceNo,
                    siteId: site.id,
                    siteName: site.name,
                    billingPeriod: billingPeriod,
                    generatedDate: new Date().toISOString().split('T')[0],
                    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    items: items.map(i => ({
                        id: Date.now().toString() + Math.random(),
                        description: i.description,
                        hsn: i.hsn,
                        rate: i.rate,
                        days: i.workingDays,
                        persons: i.persons,
                        amount: i.amount
                    })),
                    subTotal: subTotal,
                    managementRate: managementRate,
                    managementAmount: managementAmount,
                    taxableAmount: taxable,
                    cgst: cgst,
                    sgst: sgst,
                    amount: Math.round(total),
                    status: invoiceType === 'PROFORMA INVOICE' ? 'Pending Approval' : 'Unpaid',
                    materialCharges: 0
                };
                onSave(newInvoice);
            }
            onClose();
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
                                <option value="AMBE SERVICE">AMBE SERVICE</option>
                                <option value="AMBE SERVICE FACILITIES PRIVATE LIMITED">AMBE SERVICE FACILITIES PRIVATE LIMITED</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Invoice Type</label>
                            <select
                                value={invoiceType}
                                onChange={e => {
                                    const newType = e.target.value;
                                    setInvoiceType(newType);
                                    if (newType === 'PROFORMA INVOICE') {
                                        const d = new Date();
                                        setInvoiceNo(`PI/${d.getFullYear()}/${d.getMonth() + 1}/${Math.floor(Math.random() * 1000)}`);
                                    } else {
                                        const fyStart = selectedMonth >= 4 ? selectedYear : selectedYear - 1;
                                        const fyEnd = fyStart + 1;
                                        const fyStr = `${fyStart.toString().slice(-2)}-${fyEnd.toString().slice(-2)}`;
                                        setInvoiceNo(`ASF/P/${fyStr}/001`);
                                    }
                                }}
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

                            {/* PDF Upload & Parse (POC) */}
                            <div className="mt-3">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Upload Attendance PDF</label>
                                <input type="file" accept="application/pdf" onChange={(e) => {
                                    const f = e.target.files && e.target.files[0];
                                    if (f) setUploadFile(f);
                                }} className="w-full text-sm" />
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={async () => await handleUploadAndParse()}
                                        disabled={!uploadFile || !selectedSiteId || parsing}
                                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md text-sm disabled:opacity-60"
                                    >
                                        {parsing ? 'Parsing...' : 'Upload & Parse PDF'}
                                    </button>
                                    <button
                                        onClick={() => { setUploadFile(null); setParseResult(null); }}
                                        className="bg-gray-100 text-gray-700 py-2 px-3 rounded-md text-sm"
                                    >
                                        Clear
                                    </button>
                                </div>
                                {parseResult && (
                                    <div className="mt-3 text-sm bg-gray-50 p-3 rounded border">
                                        <div className="font-medium">Parsed Result Preview</div>
                                        <div className="text-xs text-gray-600">Employees parsed: {parseResult.parsed.employees.length}</div>
                                        <div className="text-xs text-gray-600">Total days (aggregated): {parseResult.items.reduce((s,i) => s + (i.working_days||0), 0)}</div>
                                        <div className="mt-2">
                                            <button onClick={() => {
                                                if (!parseResult.items) return;
                                                const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
                                                const mapped = parseResult.items.map((i: any) => ({ description: i.description, hsn: i.hsn || '9985', rate: i.rate || 25000, workingDays: i.working_days || 0, persons: i.persons || 0, amount: ((i.working_days || 0) * ((i.rate || 25000) / daysInMonth)) }));
                                                setItems(mapped);
                                                alert('Items populated from parsed PDF - review before generating');
                                            }} className="text-sm text-blue-600">Use Parsed Items</button>
                                        </div>
                                    </div>
                                )}
                            </div>
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
                                            <td className="p-2 text-right font-mono">{(item.amount || 0).toFixed(2)}</td>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
