
import React, { useState, useEffect } from 'react';
import { X, Save, Calculator, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { Invoice, InvoiceItem } from '../types';

interface EditInvoiceModalProps {
  isOpen: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onSave: (updatedInvoice: Invoice) => void;
}

const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({ isOpen, invoice, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Invoice>>({});
  const [items, setItems] = useState<InvoiceItem[]>([]);
  
  // Calculation State
  const [subTotal, setSubTotal] = useState<number>(0);
  const [managementRate, setManagementRate] = useState<string>("7");
  const [materialCharges, setMaterialCharges] = useState<string>("0");
  
  const [managementAmount, setManagementAmount] = useState<number>(0);
  const [taxableAmount, setTaxableAmount] = useState<number>(0);
  const [cgst, setCgst] = useState<number>(0);
  const [sgst, setSgst] = useState<number>(0);
  const [grandTotal, setGrandTotal] = useState<number>(0);

  // Initialize Data when invoice opens
  useEffect(() => {
    if (invoice) {
      setFormData(invoice);
      setManagementRate((invoice.managementRate || 7).toString());
      setMaterialCharges((invoice.materialCharges || 0).toString());
      
      if (invoice.items && invoice.items.length > 0) {
        setItems(invoice.items);
      } else {
        // Fallback
        const base = invoice.amount / 1.18;
        setItems([
            { id: Date.now().toString(), description: 'Service Charges', hsn: '9985', rate: base, days: 30, persons: 1, amount: base }
        ]);
      }
    }
  }, [invoice]);

  // Recalculate Totals
  useEffect(() => {
    const currentSubTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const mgmtRateVal = parseFloat(managementRate) || 0;
    const materialVal = parseFloat(materialCharges) || 0;

    const currentMgmtAmount = currentSubTotal * (mgmtRateVal / 100);
    const currentTaxable = currentSubTotal + currentMgmtAmount + materialVal;
    
    const tax = currentTaxable * 0.09; // 9%
    const total = currentTaxable + (tax * 2);

    setSubTotal(currentSubTotal);
    setManagementAmount(currentMgmtAmount);
    setTaxableAmount(currentTaxable);
    setCgst(tax);
    setSgst(tax);
    setGrandTotal(total);
  }, [items, managementRate, materialCharges]);

  if (!isOpen || !invoice) return null;

  const handleChange = (field: keyof Invoice, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(prev => prev.map(item => {
        if (item.id === id) {
            const updated = { ...item, [field]: value };
            if (field === 'rate' || field === 'persons') {
                 updated.amount = (parseFloat(updated.rate as any) || 0) * (parseFloat(updated.persons as any) || 0);
            }
            if (field === 'amount') {
                updated.amount = parseFloat(value) || 0;
            }
            return updated;
        }
        return item;
    }));
  };

  const addItem = () => {
    setItems(prev => [
        ...prev, 
        { id: Date.now().toString(), description: '', hsn: '9985', rate: 0, days: 0, persons: 1, amount: 0 }
    ]);
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSave = () => {
    const updatedInvoice: Invoice = {
        ...invoice,
        ...formData,
        items: items,
        subTotal: subTotal,
        managementRate: parseFloat(managementRate),
        managementAmount: managementAmount,
        materialCharges: parseFloat(materialCharges),
        taxableAmount: taxableAmount,
        cgst: cgst,
        sgst: sgst,
        amount: Math.round(grandTotal)
    } as Invoice;
    onSave(updatedInvoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-primary px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Calculator size={20} /> {invoice.id ? 'Edit Invoice' : 'New Invoice'}
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Header Info (Editable) */}
          <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Invoice No</label>
              <input 
                value={formData.invoiceNo}
                onChange={(e) => handleChange('invoiceNo', e.target.value)}
                className="w-full border rounded px-2 py-1 font-mono text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Site / Project</label>
              <input 
                value={formData.siteName}
                onChange={(e) => handleChange('siteName', e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
             <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Billing Period</label>
              <input 
                value={formData.billingPeriod}
                onChange={(e) => handleChange('billingPeriod', e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-bold text-gray-700 uppercase">Bill Items</label>
                <button onClick={addItem} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1">
                    <Plus size={12} /> Add Item
                </button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 text-gray-600 font-bold">
                        <tr>
                            <th className="p-2 border-r">Description</th>
                            <th className="p-2 border-r w-20">HSN</th>
                            <th className="p-2 border-r w-24">Rate</th>
                            <th className="p-2 border-r w-16">Days</th>
                            <th className="p-2 border-r w-16">Pers</th>
                            <th className="p-2 border-r w-32 text-right">Amount</th>
                            <th className="p-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id} className="border-t hover:bg-gray-50">
                                <td className="p-2 border-r">
                                    <input 
                                        value={item.description} 
                                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                        className="w-full bg-transparent outline-none" 
                                        placeholder="Description"
                                    />
                                </td>
                                <td className="p-2 border-r">
                                    <input 
                                        value={item.hsn} 
                                        onChange={(e) => handleItemChange(item.id, 'hsn', e.target.value)}
                                        className="w-full bg-transparent outline-none"
                                    />
                                </td>
                                <td className="p-2 border-r">
                                    <input 
                                        type="number"
                                        value={item.rate} 
                                        onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                                        className="w-full bg-transparent outline-none"
                                    />
                                </td>
                                <td className="p-2 border-r">
                                    <input 
                                        type="number"
                                        value={item.days} 
                                        onChange={(e) => handleItemChange(item.id, 'days', e.target.value)}
                                        className="w-full bg-transparent outline-none"
                                    />
                                </td>
                                <td className="p-2 border-r">
                                    <input 
                                        type="number"
                                        value={item.persons} 
                                        onChange={(e) => handleItemChange(item.id, 'persons', e.target.value)}
                                        className="w-full bg-transparent outline-none"
                                    />
                                </td>
                                <td className="p-2 border-r text-right font-mono">
                                    <input 
                                        type="number"
                                        value={item.amount} 
                                        onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)}
                                        className="w-full bg-transparent outline-none text-right font-bold"
                                    />
                                </td>
                                <td className="p-2 text-center">
                                    <button onClick={() => deleteItem(item.id)} className="text-gray-400 hover:text-red-500">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>

          {/* Calculations Summary */}
          <div className="flex justify-between gap-8">
            <div className="flex-1 pt-4">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Additional Charges</label>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-500">Management Rate (%)</label>
                        <input 
                            type="number"
                            value={managementRate}
                            onChange={(e) => setManagementRate(e.target.value)}
                            className="w-full border rounded p-2 mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Material Charges</label>
                        <input 
                            type="number"
                            value={materialCharges}
                            onChange={(e) => setMaterialCharges(e.target.value)}
                            className="w-full border rounded p-2 mt-1"
                        />
                    </div>
                </div>
            </div>

            <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500">Sub Total</span>
                    <span className="font-bold">₹{subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Mgmt Charges ({managementRate}%)</span>
                    <span className="text-gray-700">₹{managementAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Material</span>
                    <span className="text-gray-700">₹{parseFloat(materialCharges || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-medium">
                    <span>Taxable Value</span>
                    <span>₹{taxableAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">CGST (9%)</span>
                    <span>₹{cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">SGST (9%)</span>
                    <span>₹{sgst.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between items-center mt-2 bg-green-50 p-2 rounded">
                    <span className="text-base font-bold text-primary">Grand Total</span>
                    <span className="text-xl font-bold text-primary">₹{Math.round(grandTotal).toFixed(2)}</span>
                </div>
            </div>
          </div>

          {/* Meta Data */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Payment Status</label>
              <select 
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none appearance-none font-medium
                    ${formData.status === 'Paid' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Due Date</label>
              <input 
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100 flex-shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-teal-600 flex items-center gap-2 shadow-sm transition-colors active:scale-95"
          >
            <Save size={18} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditInvoiceModal;
