
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { ChevronLeft, Plus } from 'lucide-react-native';

interface AdvanceInterfaceProps {
  onBack: () => void;
}

const AdvanceInterface: React.FC<AdvanceInterfaceProps> = ({ onBack }) => {
  const [selectedSite, setSelectedSite] = useState('All Sites');
  const sites = ['All Sites', 'Office', 'Maruti', 'Aalim', 'Aarti'];

  const employees = [
    { id: 1, name: 'Suman', site: 'Office', totalAdvance: 5000, recovered: 2000, pending: 3000 },
    { id: 2, name: 'Gajarabai', site: 'Maruti', totalAdvance: 10000, recovered: 1000, pending: 9000 },
    { id: 3, name: 'Maruti', site: 'Maruti', totalAdvance: 2000, recovered: 2000, pending: 0 },
    { id: 4, name: 'Vikram', site: 'Office', totalAdvance: 15000, recovered: 5000, pending: 10000 },
    { id: 5, name: 'Renu', site: 'Aalim', totalAdvance: 500, recovered: 0, pending: 500 },
  ];

  const filtered = selectedSite === 'All Sites' ? employees : employees.filter(e => e.site === selectedSite);

  const totalGiven = filtered.reduce((acc, emp) => acc + emp.totalAdvance, 0);
  const totalRecovered = filtered.reduce((acc, emp) => acc + emp.recovered, 0);
  const totalPending = filtered.reduce((acc, emp) => acc + emp.pending, 0);

  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return `₹${(amount / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}k`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F3F5F9]">
      <View className="px-6 py-4 bg-white border-b border-slate-100 flex-row items-center justify-between">
        <TouchableOpacity onPress={onBack} className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center">
          <ChevronLeft size={24} color="#64748b" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-800">Staff Advance</Text>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-indigo-50 items-center justify-center">
            <Plus size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 100 }}>
         {/* Filter */}
         <View className="mb-6">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Filter by Site</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {sites.map(site => (
                    <TouchableOpacity
                        key={site}
                        onPress={() => setSelectedSite(site)}
                        className={`px-4 py-2 rounded-full mr-2 ${
                            selectedSite === site 
                            ? 'bg-indigo-500 shadow-md' 
                            : 'bg-white border border-slate-200'
                        }`}
                    >
                        <Text className={`text-xs font-bold ${selectedSite === site ? 'text-white' : 'text-slate-600'}`}>{site}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
         </View>

         {/* Stats */}
         <View className="flex-row space-x-3 mb-8">
             <View className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-slate-50 items-center mr-1">
                 <Text className="text-[10px] text-slate-400 font-bold uppercase">Given</Text>
                 <Text className="text-sm font-bold text-indigo-600 mt-1">{formatAmount(totalGiven)}</Text>
             </View>
             <View className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-slate-50 items-center mx-1">
                 <Text className="text-[10px] text-slate-400 font-bold uppercase">Recovered</Text>
                 <Text className="text-sm font-bold text-green-500 mt-1">{formatAmount(totalRecovered)}</Text>
             </View>
             <View className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-slate-50 items-center ml-1">
                 <Text className="text-[10px] text-slate-400 font-bold uppercase">Pending</Text>
                 <Text className="text-sm font-bold text-red-500 mt-1">{formatAmount(totalPending)}</Text>
             </View>
         </View>

         {/* List */}
         <View className="space-y-4">
             {filtered.map(emp => (
                 <View key={emp.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
                     <View className="flex-row justify-between items-start mb-4">
                         <View className="flex-row items-center">
                             <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mr-3">
                                 <Text className="text-xs font-bold text-indigo-700">{emp.name.substring(0,2).toUpperCase()}</Text>
                             </View>
                             <View>
                                 <Text className="font-bold text-slate-800">{emp.name}</Text>
                                 <Text className="text-xs text-slate-500">{emp.site}</Text>
                             </View>
                         </View>
                         <View className="items-end">
                             <Text className="text-[10px] font-bold text-slate-400 uppercase">Pending</Text>
                             <Text className={`font-bold ${emp.pending > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                 ₹ {emp.pending.toLocaleString()}
                             </Text>
                         </View>
                     </View>

                     {/* Progress Bar */}
                     <View className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                         <View 
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${(emp.recovered / emp.totalAdvance) * 100}%` }}
                         />
                     </View>
                     <View className="flex-row justify-between">
                         <Text className="text-[10px] font-bold text-slate-500">Recovered: ₹{emp.recovered}</Text>
                         <Text className="text-[10px] font-bold text-slate-500">Total: ₹{emp.totalAdvance}</Text>
                     </View>
                     
                     {emp.pending > 0 && (
                         <View className="mt-4 flex-row space-x-2">
                             <TouchableOpacity className="flex-1 py-2 rounded-lg bg-green-50 items-center border border-green-100 mr-2">
                                 <Text className="text-green-600 text-xs font-bold">Recover</Text>
                             </TouchableOpacity>
                             <TouchableOpacity className="flex-1 py-2 rounded-lg bg-indigo-50 items-center border border-indigo-100 ml-2">
                                 <Text className="text-indigo-600 text-xs font-bold">+ Give More</Text>
                             </TouchableOpacity>
                         </View>
                     )}
                 </View>
             ))}
         </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdvanceInterface;
