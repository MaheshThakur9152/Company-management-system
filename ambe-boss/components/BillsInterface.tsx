
import React, { useState } from 'react';

interface BillsInterfaceProps {
  onBack: () => void;
}

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface PaymentRecord {
  date: string;
  amount: number;
  method: string;
  reference: string;
}

interface Bill {
  id: number;
  vendor: string;
  date: string;
  amount: number;
  due?: string; // For unpaid
  status?: string; // For paid
  invoiceNo: string;
  items: LineItem[];
  subtotal: number;
  tax: number;
  payments?: PaymentRecord[];
}

const BillsInterface: React.FC<BillsInterfaceProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'UNPAID' | 'PAID'>('UNPAID');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const unpaidBills: Bill[] = [
    { 
      id: 1, 
      vendor: 'Laxmi Hardware', 
      date: '20 Dec 2025', 
      amount: 15400, 
      due: 'Due Today',
      invoiceNo: 'INV-2025-LH-001',
      subtotal: 13750,
      tax: 1650,
      items: [
        { description: 'Cement Bags (UltraTech)', quantity: 20, rate: 450, amount: 9000 },
        { description: 'Sand (Tractor Load)', quantity: 1, rate: 4750, amount: 4750 }
      ]
    },
    { 
      id: 2, 
      vendor: 'Power Grid Corp', 
      date: '18 Dec 2025', 
      amount: 4200, 
      due: 'Due in 2 days',
      invoiceNo: 'ELEC-DEC-25-884',
      subtotal: 4000,
      tax: 200,
      items: [
        { description: 'Electricity Usage (Site A)', quantity: 1, rate: 3500, amount: 3500 },
        { description: 'Meter Rent', quantity: 1, rate: 500, amount: 500 }
      ]
    },
    { 
      id: 3, 
      vendor: 'Sai Water Tankers', 
      date: '15 Dec 2025', 
      amount: 2500, 
      due: 'Overdue',
      invoiceNo: 'H2O-9921',
      subtotal: 2500,
      tax: 0,
      items: [
        { description: 'Water Tanker (1000L)', quantity: 5, rate: 500, amount: 2500 }
      ]
    },
    { 
      id: 4, 
      vendor: 'Rahul Cement', 
      date: '22 Dec 2025', 
      amount: 35000, 
      due: 'Due in 5 days',
      invoiceNo: 'RC-INV-882',
      subtotal: 31250,
      tax: 3750,
      items: [
        { description: 'Cement Grade 53', quantity: 100, rate: 312.50, amount: 31250 }
      ]
    },
  ];

  const paidBills: Bill[] = [
    { 
      id: 5, 
      vendor: 'Jio Internet', 
      date: '10 Dec 2025', 
      amount: 999, 
      status: 'Paid via UPI',
      invoiceNo: 'JIO-FIBER-DEC',
      subtotal: 846.61,
      tax: 152.39,
      items: [
        { description: 'JioFiber Silver Plan', quantity: 1, rate: 846.61, amount: 846.61 }
      ],
      payments: [
        { date: '10 Dec 2025, 10:30 AM', amount: 999, method: 'UPI', reference: 'UPI-392847' }
      ]
    },
    { 
      id: 6, 
      vendor: 'Office Rent', 
      date: '01 Dec 2025', 
      amount: 25000, 
      status: 'Paid via Bank',
      invoiceNo: 'RENT-DEC-2025',
      subtotal: 25000,
      tax: 0,
      items: [
        { description: 'Office Rent - Dec 2025', quantity: 1, rate: 25000, amount: 25000 }
      ],
       payments: [
        { date: '01 Dec 2025, 09:00 AM', amount: 25000, method: 'NEFT', reference: 'HDFC-N88372' }
      ]
    },
    { 
      id: 7, 
      vendor: 'Sharma Stationery', 
      date: '05 Dec 2025', 
      amount: 1200, 
      status: 'Paid Cash',
      invoiceNo: 'SS-992',
      subtotal: 1000,
      tax: 200,
      items: [
        { description: 'A4 Paper Rims', quantity: 5, rate: 200, amount: 1000 }
      ],
       payments: [
        { date: '05 Dec 2025, 02:15 PM', amount: 1200, method: 'Cash', reference: 'N/A' }
      ]
    },
  ];

  const totalOutstanding = unpaidBills.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = paidBills.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="flex flex-col h-full bg-[#F3F5F9] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-white/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20 border-b border-white/50 shadow-sm flex-none">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition text-slate-600">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <h2 className="text-lg font-bold text-slate-800">Bills & Invoices</h2>
        <button className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center hover:bg-orange-100 text-orange-500">
            <i className="fa-solid fa-plus"></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 custom-scrollbar">
        
        {/* Toggle Switch */}
        <div className="bg-white p-1 rounded-xl flex shadow-sm border border-slate-100 mb-8">
            <button 
                onClick={() => setActiveTab('UNPAID')}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'UNPAID' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                Unpaid Bills
            </button>
            <button 
                onClick={() => setActiveTab('PAID')}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'PAID' ? 'bg-green-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                Paid History
            </button>
        </div>

        {/* Summary */}
        <div className="mb-6">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-2">
                {activeTab === 'UNPAID' ? 'Total Outstanding' : 'Total Paid this month'}
            </p>
            <h1 className={`text-3xl font-bold ${activeTab === 'UNPAID' ? 'text-slate-800' : 'text-green-600'}`}>
                ₹ {(activeTab === 'UNPAID' ? totalOutstanding : totalPaid).toLocaleString()}
            </h1>
        </div>

        {/* List */}
        <div className="space-y-4">
            {(activeTab === 'UNPAID' ? unpaidBills : paidBills).map((bill) => (
                <button 
                  key={bill.id} 
                  onClick={() => setSelectedBill(bill)}
                  className="w-full bg-white p-5 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-transform text-left"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${activeTab === 'UNPAID' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'}`}>
                            <i className={`fa-solid ${activeTab === 'UNPAID' ? 'fa-file-invoice' : 'fa-check'}`}></i>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">{bill.vendor}</h3>
                            <p className="text-xs text-slate-500 font-medium">{bill.date}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-slate-800">₹ {bill.amount.toLocaleString()}</p>
                        <p className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full inline-block ${
                             activeTab === 'PAID' 
                                ? 'bg-green-100 text-green-600' 
                                : bill.due === 'Overdue' ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-600'
                        }`}>
                            {activeTab === 'PAID' ? bill.status : bill.due}
                        </p>
                    </div>
                </button>
            ))}
        </div>

        {activeTab === 'UNPAID' && unpaidBills.length === 0 && (
             <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fa-solid fa-mug-hot text-green-500 text-2xl"></i>
                </div>
                <p className="font-bold text-slate-800">All caught up!</p>
                <p className="text-sm text-slate-500">No unpaid bills at the moment.</p>
             </div>
        )}
      </div>

      {/* Bill Details Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-lg rounded-t-[30px] sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 duration-300">
              
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white z-10 sticky top-0">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Bill Details</h3>
                    <p className="text-xs text-slate-500 font-medium">#{selectedBill.invoiceNo}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedBill(null)}
                    className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto p-6 custom-scrollbar">
                  
                  {/* Status Badge */}
                  <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${activeTab === 'UNPAID' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                            <i className={`fa-solid ${activeTab === 'UNPAID' ? 'fa-store' : 'fa-check-circle'}`}></i>
                         </div>
                         <div>
                            <h4 className="font-bold text-slate-800 text-lg">{selectedBill.vendor}</h4>
                            <p className="text-xs text-slate-500">{selectedBill.date}</p>
                         </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          activeTab === 'PAID' 
                            ? 'bg-green-50 text-green-600 border border-green-100' 
                            : selectedBill.due === 'Overdue' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                      }`}>
                          {activeTab === 'PAID' ? 'Paid' : selectedBill.due}
                      </span>
                  </div>

                  {/* Line Items */}
                  <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
                      <table className="w-full text-left text-sm">
                          <thead>
                              <tr className="text-xs font-bold text-slate-400 uppercase border-b border-slate-200">
                                  <th className="pb-2 font-bold w-1/2">Item</th>
                                  <th className="pb-2 font-bold text-center">Qty</th>
                                  <th className="pb-2 font-bold text-right">Amount</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {selectedBill.items.map((item, idx) => (
                                  <tr key={idx}>
                                      <td className="py-3 pr-2">
                                          <p className="font-semibold text-slate-700">{item.description}</p>
                                          <p className="text-[10px] text-slate-400">@ ₹{item.rate}/unit</p>
                                      </td>
                                      <td className="py-3 text-center text-slate-600 font-medium">{item.quantity}</td>
                                      <td className="py-3 text-right font-bold text-slate-800">₹{item.amount.toLocaleString()}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                      
                      {/* Breakdown */}
                      <div className="border-t border-slate-200 mt-2 pt-3 space-y-2">
                          <div className="flex justify-between text-xs text-slate-500">
                              <span>Subtotal</span>
                              <span className="font-medium">₹{selectedBill.subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                              <span>Tax (GST)</span>
                              <span className="font-medium">₹{selectedBill.tax.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-base font-bold text-slate-800 pt-2 border-t border-slate-200 border-dashed mt-2">
                              <span>Total Amount</span>
                              <span>₹{selectedBill.amount.toLocaleString()}</span>
                          </div>
                      </div>
                  </div>

                  {/* Payment Info (Only for Paid) */}
                  {selectedBill.payments && (
                      <div className="mb-6">
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Payment History</h5>
                          <div className="space-y-2">
                              {selectedBill.payments.map((payment, i) => (
                                  <div key={i} className="flex justify-between items-center bg-green-50/50 p-3 rounded-xl border border-green-100">
                                      <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">
                                              <i className="fa-solid fa-arrow-right-arrow-left"></i>
                                          </div>
                                          <div>
                                              <p className="text-xs font-bold text-slate-700">{payment.method}</p>
                                              <p className="text-[10px] text-slate-400">Ref: {payment.reference}</p>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                           <p className="text-xs font-bold text-slate-800">₹{payment.amount.toLocaleString()}</p>
                                           <p className="text-[10px] text-slate-500">{payment.date}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {/* Additional Info for Unpaid */}
                   {!selectedBill.payments && (
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3 mb-6">
                          <i className="fa-solid fa-circle-info text-blue-500 mt-0.5"></i>
                          <p className="text-xs text-blue-800 leading-relaxed">
                              This invoice is due. Please ensure payment is made before the due date to avoid late fees.
                          </p>
                      </div>
                  )}

              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
                  {activeTab === 'UNPAID' ? (
                      <>
                        <button className="flex-1 bg-white border border-slate-200 text-slate-700 py-3.5 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition active:scale-95">
                            Ignore
                        </button>
                        <button className="flex-[2] bg-gradient-to-r from-orange-500 to-red-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-orange-200 hover:shadow-orange-300 transition active:scale-95 flex items-center justify-center gap-2">
                            <span>Pay ₹{selectedBill.amount.toLocaleString()}</span>
                            <i className="fa-solid fa-arrow-right"></i>
                        </button>
                      </>
                  ) : (
                      <>
                        <button className="flex-1 bg-white border border-slate-200 text-slate-700 py-3.5 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition active:scale-95 flex items-center justify-center gap-2">
                             <i className="fa-solid fa-share-nodes"></i> Share
                        </button>
                        <button className="flex-[2] bg-slate-800 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-slate-300 hover:bg-slate-700 transition active:scale-95 flex items-center justify-center gap-2">
                            <i className="fa-solid fa-download"></i> Download Receipt
                        </button>
                      </>
                  )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default BillsInterface;
