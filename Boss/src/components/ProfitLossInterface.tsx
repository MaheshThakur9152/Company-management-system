
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { ChevronLeft, ArrowUpRight, ArrowDownLeft, TrendingUp } from 'lucide-react-native';

interface ProfitLossInterfaceProps {
  onBack: () => void;
}

const ProfitLossInterface: React.FC<ProfitLossInterfaceProps> = ({ onBack }) => {
  const [period, setPeriod] = useState('Dec 2025');

  // Mock Data
  const stats = {
    netProfit: 124500,
    totalIncome: 450000,
    totalExpense: 325500,
  };

  const monthlyData = [
    { month: 'Sep', income: 30, expense: 20 },
    { month: 'Oct', income: 45, expense: 35 },
    { month: 'Nov', income: 38, expense: 40 },
    { month: 'Dec', income: 60, expense: 45 },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F3F5F9]">
      {/* Header */}
      <View className="px-6 py-4 bg-white/80 border-b border-slate-100 flex-row items-center justify-between">
        <TouchableOpacity onPress={onBack} className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center">
          <ChevronLeft size={24} color="#64748b" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-800">Financial Overview</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Period Selector */}
        <View className="flex-row justify-between items-center mb-6">
            <Text className="font-bold text-slate-700 text-lg">Report</Text>
            <TouchableOpacity className="bg-white border border-slate-200 py-2 px-4 rounded-xl flex-row items-center">
                <Text className="text-sm font-semibold text-slate-700">{period}</Text>
            </TouchableOpacity>
        </View>

        {/* Net Profit Card */}
        <View className="bg-slate-900 rounded-3xl p-6 shadow-xl mb-6 overflow-hidden">
            <Text className="text-slate-400 text-sm font-medium mb-1">Net Profit ({period})</Text>
            <Text className="text-4xl font-bold text-white mb-4 tracking-tight">₹ {stats.netProfit.toLocaleString()}</Text>
            <View className="flex-row items-center bg-white/10 self-start px-3 py-1 rounded-full border border-white/10">
                <TrendingUp size={12} color="#4ade80" />
                <Text className="text-xs font-bold text-green-400 ml-1.5">+12.5% vs last month</Text>
            </View>
        </View>

        {/* Income vs Expense Cards */}
        <View className="flex-row items-center mb-8">
            <View className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mr-2">
                <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center mb-3">
                    <ArrowDownLeft size={20} color="#22c55e" />
                </View>
                <Text className="text-slate-500 text-xs font-medium mb-1">Total Income</Text>
                <Text className="text-xl font-bold text-slate-800">₹ {(stats.totalIncome / 1000).toFixed(1)}k</Text>
            </View>
            <View className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 ml-2">
                <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center mb-3">
                    <ArrowUpRight size={20} color="#ef4444" />
                </View>
                <Text className="text-slate-500 text-xs font-medium mb-1">Total Expense</Text>
                <Text className="text-xl font-bold text-slate-800">₹ {(stats.totalExpense / 1000).toFixed(1)}k</Text>
            </View>
        </View>

        {/* Performance Chart */}
        <View className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
            <View className="flex-row justify-between items-center mb-6">
                <Text className="font-bold text-slate-800">Performance</Text>
                <View className="flex-row space-x-3">
                     <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-slate-800 mr-1.5" />
                        <Text className="text-[10px] font-bold text-slate-500">Income</Text>
                     </View>
                     <View className="flex-row items-center ml-2">
                        <View className="w-2 h-2 rounded-full bg-slate-200 mr-1.5" />
                        <Text className="text-[10px] font-bold text-slate-500">Expense</Text>
                     </View>
                </View>
            </View>
            
            <View className="flex-row items-end justify-between h-40">
                {monthlyData.map((data, index) => (
                    <View key={index} className="flex-1 items-center">
                        <View className="flex-row items-end h-full w-full justify-center">
                            <View className="w-3 bg-slate-800 rounded-t-full mx-0.5" style={{ height: `${data.income}%` }} />
                            <View className="w-3 bg-slate-200 rounded-t-full mx-0.5" style={{ height: `${data.expense}%` }} />
                        </View>
                        <Text className="text-[10px] font-bold text-slate-400 mt-2">{data.month}</Text>
                    </View>
                ))}
            </View>
        </View>

        {/* Breakdown */}
        <View>
            <Text className="font-bold text-slate-800 mb-4">Breakdown</Text>
            <View className="space-y-3">
                {[
                    { label: 'Site Operations', amount: 120000, color: 'bg-blue-500' },
                    { label: 'Staff Salaries', amount: 85000, color: 'bg-purple-500' },
                    { label: 'Equipment Maintenance', amount: 45000, color: 'bg-orange-500' },
                    { label: 'Logistics', amount: 30000, color: 'bg-pink-500' },
                ].map((item, i) => (
                    <View key={i} className="bg-white p-4 rounded-xl flex-row items-center justify-between shadow-sm border border-slate-50 mb-2">
                        <View className="flex-row items-center">
                            <View className={`w-3 h-3 rounded-full ${item.color} mr-3`} />
                            <Text className="text-sm font-semibold text-slate-700">{item.label}</Text>
                        </View>
                        <Text className="text-sm font-bold text-slate-800">₹ {item.amount.toLocaleString()}</Text>
                    </View>
                ))}
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfitLossInterface;
