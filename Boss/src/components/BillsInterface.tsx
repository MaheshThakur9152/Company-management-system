
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Modal, StyleSheet } from 'react-native';
import { ChevronLeft, Plus, FileText, Check, X, Store, CheckCircle, Info, Share2, Download, ArrowRight } from 'lucide-react-native';

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
  due?: string;
  status?: string;
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
      id: 1, vendor: 'Laxmi Hardware', date: '20 Dec 2025', amount: 15400, due: 'Due Today',
      invoiceNo: 'INV-2025-LH-001', subtotal: 13750, tax: 1650,
      items: [
        { description: 'Cement Bags (UltraTech)', quantity: 20, rate: 450, amount: 9000 },
        { description: 'Sand (Tractor Load)', quantity: 1, rate: 4750, amount: 4750 }
      ]
    },
    { 
      id: 2, vendor: 'Power Grid Corp', date: '18 Dec 2025', amount: 4200, due: 'Due in 2 days',
      invoiceNo: 'ELEC-DEC-25-884', subtotal: 4000, tax: 200,
      items: [
        { description: 'Electricity Usage (Site A)', quantity: 1, rate: 3500, amount: 3500 },
        { description: 'Meter Rent', quantity: 1, rate: 500, amount: 500 }
      ]
    },
     { 
      id: 3, vendor: 'Sai Water Tankers', date: '15 Dec 2025', amount: 2500, due: 'Overdue',
      invoiceNo: 'H2O-9921', subtotal: 2500, tax: 0,
      items: [{ description: 'Water Tanker (1000L)', quantity: 5, rate: 500, amount: 2500 }]
    },
  ];

  const paidBills: Bill[] = [
    { 
      id: 5, vendor: 'Jio Internet', date: '10 Dec 2025', amount: 999, status: 'Paid via UPI',
      invoiceNo: 'JIO-FIBER-DEC', subtotal: 846.61, tax: 152.39,
      items: [{ description: 'JioFiber Silver Plan', quantity: 1, rate: 846.61, amount: 846.61 }],
      payments: [{ date: '10 Dec 2025, 10:30 AM', amount: 999, method: 'UPI', reference: 'UPI-392847' }]
    },
  ];

  const totalOutstanding = unpaidBills.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = paidBills.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <SafeAreaView className="flex-1 bg-[#F3F5F9]">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-slate-100 flex-row items-center justify-between">
        <TouchableOpacity onPress={onBack} className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center">
          <ChevronLeft size={24} color="#64748b" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-800">Bills & Invoices</Text>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center">
            <Plus size={20} color="#f97316" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Toggle Switch */}
        <View className="bg-white p-1 rounded-xl flex-row shadow-sm border border-slate-100 mb-8">
            <TouchableOpacity 
                onPress={() => setActiveTab('UNPAID')}
                className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'UNPAID' ? 'bg-orange-500 shadow-md' : ''}`}
            >
                <Text className={`text-sm font-bold ${activeTab === 'UNPAID' ? 'text-white' : 'text-slate-500'}`}>Unpaid Bills</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                onPress={() => setActiveTab('PAID')}
                className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'PAID' ? 'bg-green-500 shadow-md' : ''}`}
            >
                <Text className={`text-sm font-bold ${activeTab === 'PAID' ? 'text-white' : 'text-slate-500'}`}>Paid History</Text>
            </TouchableOpacity>
        </View>

        {/* Summary */}
        <View className="mb-6">
            <Text className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-2">
                {activeTab === 'UNPAID' ? 'Total Outstanding' : 'Total Paid this month'}
            </Text>
            <Text className={`text-3xl font-bold ${activeTab === 'UNPAID' ? 'text-slate-800' : 'text-green-600'}`}>
                ₹ {(activeTab === 'UNPAID' ? totalOutstanding : totalPaid).toLocaleString()}
            </Text>
        </View>

        {/* List */}
        <View className="space-y-4">
            {(activeTab === 'UNPAID' ? unpaidBills : paidBills).map((bill) => (
                <TouchableOpacity 
                  key={bill.id} 
                  onPress={() => setSelectedBill(bill)}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex-row items-center justify-between mb-4"
                >
                    <View className="flex-row items-center">
                        <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${activeTab === 'UNPAID' ? 'bg-orange-50' : 'bg-green-50'}`}>
                            {activeTab === 'UNPAID' ? <FileText size={24} color="#f97316" /> : <Check size={24} color="#22c55e" />}
                        </View>
                        <View>
                            <Text className="font-bold text-slate-800">{bill.vendor}</Text>
                            <Text className="text-xs text-slate-500 font-medium">{bill.date}</Text>
                        </View>
                    </View>
                    <View className="items-end">
                        <Text className="font-bold text-slate-800">₹ {bill.amount.toLocaleString()}</Text>
                        <View className={`mt-1 px-2 py-0.5 rounded-full ${activeTab === 'PAID' ? 'bg-green-100' : (bill.due === 'Overdue' ? 'bg-red-100' : 'bg-orange-100')}`}>
                            <Text className={`text-[10px] font-bold ${activeTab === 'PAID' ? 'text-green-600' : (bill.due === 'Overdue' ? 'text-red-500' : 'text-orange-600')}`}>
                                {activeTab === 'PAID' ? bill.status : bill.due}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
      </ScrollView>

      {/* Bill Details Modal */}
      {selectedBill && (
        <Modal transparent animationType="slide" visible={!!selectedBill}>
            <View className="flex-1 bg-black/60 justify-end">
                <TouchableOpacity className="flex-1" onPress={() => setSelectedBill(null)} />
                <View className="bg-white rounded-t-[30px] p-6 max-h-[80%]">
                    <View className="flex-row justify-between items-center mb-6">
                        <View>
                            <Text className="text-xl font-bold text-slate-800">Bill Details</Text>
                            <Text className="text-xs text-slate-500">#{selectedBill.invoiceNo}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedBill(null)} className="w-9 h-9 rounded-full bg-slate-50 items-center justify-center">
                            <X size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View className="flex-row justify-between items-start mb-6">
                            <View className="flex-row items-center">
                                <View className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${activeTab === 'UNPAID' ? 'bg-orange-100' : 'bg-green-100'}`}>
                                    <Store size={24} color={activeTab === 'UNPAID' ? '#f97316' : '#22c55e'} />
                                </View>
                                <View>
                                    <Text className="font-bold text-slate-800 text-lg">{selectedBill.vendor}</Text>
                                    <Text className="text-xs text-slate-500">{selectedBill.date}</Text>
                                </View>
                            </View>
                            <View className={`px-3 py-1 rounded-full ${activeTab === 'PAID' ? 'bg-green-50 border border-green-100' : 'bg-orange-50 border border-orange-100'}`}>
                                <Text className={`text-xs font-bold ${activeTab === 'PAID' ? 'text-green-600' : 'text-orange-600'}`}>
                                    {activeTab === 'PAID' ? 'Paid' : selectedBill.due}
                                </Text>
                            </View>
                        </View>

                        <View className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
                            {selectedBill.items.map((item, idx) => (
                                <View key={idx} className="flex-row justify-between py-3 border-b border-slate-100 last:border-0">
                                    <View className="flex-1">
                                        <Text className="font-semibold text-slate-700">{item.description}</Text>
                                        <Text className="text-[10px] text-slate-400">@ ₹{item.rate}/unit x {item.quantity}</Text>
                                    </View>
                                    <Text className="font-bold text-slate-800">₹{item.amount.toLocaleString()}</Text>
                                </View>
                            ))}
                            <View className="mt-2 pt-3 border-t border-slate-200 border-dashed">
                                <View className="flex-row justify-between mb-1">
                                    <Text className="text-xs text-slate-500">Subtotal</Text>
                                    <Text className="text-xs font-medium text-slate-500">₹{selectedBill.subtotal.toLocaleString()}</Text>
                                </View>
                                <View className="flex-row justify-between mb-2">
                                    <Text className="text-xs text-slate-500">Tax</Text>
                                    <Text className="text-xs font-medium text-slate-500">₹{selectedBill.tax.toLocaleString()}</Text>
                                </View>
                                <View className="flex-row justify-between pt-2 border-t border-slate-200">
                                    <Text className="font-bold text-slate-800">Total Amount</Text>
                                    <Text className="font-bold text-slate-800">₹{selectedBill.amount.toLocaleString()}</Text>
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    <View className="flex-row space-x-3 mt-4">
                        {activeTab === 'UNPAID' ? (
                            <TouchableOpacity className="flex-1 bg-orange-500 py-4 rounded-xl items-center flex-row justify-center">
                                <Text className="text-white font-bold mr-2">Pay Now</Text>
                                <ArrowRight size={18} color="white" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity className="flex-1 bg-slate-800 py-4 rounded-xl items-center flex-row justify-center">
                                <Download size={18} color="white" className="mr-2" />
                                <Text className="text-white font-bold ml-2">Receipt</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default BillsInterface;
