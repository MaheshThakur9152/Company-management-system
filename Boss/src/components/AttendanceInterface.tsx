
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Image, Modal } from 'react-native';
import { ChevronLeft, FileUp, Filter, Calendar, Plus, Camera, X, MapPin } from 'lucide-react-native';

interface AttendanceInterfaceProps {
  onBack: () => void;
}

interface AttendanceRecord {
  status: 'P' | 'A' | 'WO' | 'H';
  imageUrl?: string;
  timestamp?: string;
}

interface Employee {
  id: string;
  name: string;
  site: string;
  role: string;
  avatarSeed: string;
  phone?: string;
  attendance: AttendanceRecord[]; 
}

const AttendanceInterface: React.FC<AttendanceInterfaceProps> = ({ onBack }) => {
  const [selectedSite, setSelectedSite] = useState('All Sites');
  const [selectedMonth, setSelectedMonth] = useState('Dec 2025');
  const [viewImage, setViewImage] = useState<{url: string, employeeName: string, date: string} | null>(null);

  const sites = ['All Sites', 'Office', 'Maruti', 'Aalim', 'Aarti'];

  const generateAttendance = (seed: number): AttendanceRecord[] => {
    return Array.from({ length: 31 }, (_, i) => {
      const rand = Math.random();
      if (rand > 0.8) return { status: 'A' };
      if (rand > 0.7) return { status: 'H' };
      if (rand > 0.6) return { status: 'WO' };
      const hasImage = Math.random() > 0.5;
      return { 
        status: 'P', 
        imageUrl: hasImage ? `https://picsum.photos/seed/${seed + i}/400/600` : undefined 
      };
    });
  };

  const employees: Employee[] = [
    { id: '1234', name: 'Suman', site: 'Office', role: 'Staff', avatarSeed: 'Suman', phone: '12345679', attendance: generateAttendance(100) },
    { id: '1235', name: 'Gajarabai', site: 'Maruti', role: 'Worker', avatarSeed: 'Gajarabai', attendance: generateAttendance(200) },
    { id: '1236', name: 'Maruti', site: 'Maruti', role: 'Worker', avatarSeed: 'Maruti', attendance: generateAttendance(300) },
    { id: '1237', name: 'Renu', site: 'Aalim', role: 'Worker', avatarSeed: 'Renu', attendance: generateAttendance(400) },
    { id: '2001', name: 'Aalim', site: 'Aalim', role: 'Supervisor', avatarSeed: 'Aalim', attendance: generateAttendance(500) },
    { id: '14084', name: 'Aarti', site: 'Aarti', role: 'Manager', avatarSeed: 'Aarti', attendance: generateAttendance(600) },
    { id: '14085', name: 'Vikram', site: 'Office', role: 'Driver', avatarSeed: 'Vikram', phone: '98765432', attendance: generateAttendance(700) },
    { id: '14086', name: 'Rohit', site: 'Office', role: 'Staff', avatarSeed: 'Rohit', attendance: generateAttendance(800) },
    { id: '14087', name: 'Priya', site: 'Aalim', role: 'Worker', avatarSeed: 'Priya', attendance: generateAttendance(900) },
  ];

  const filteredEmployees = selectedSite === 'All Sites' 
    ? employees 
    : employees.filter(emp => emp.site === selectedSite);

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5 py-4 bg-white border-b border-slate-200">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={onBack} className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center">
            <ChevronLeft size={20} color="#64748b" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-lg font-bold text-slate-800">Attendance Grid</Text>
            <Text className="text-xs text-slate-500 font-medium">{selectedSite} • {selectedMonth}</Text>
          </View>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-green-50 items-center justify-center border border-green-100">
             <FileUp size={18} color="#22c55e" />
          </TouchableOpacity>
        </View>

        {/* Filters Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            <TouchableOpacity className="bg-slate-50 border border-slate-200 py-2.5 px-4 rounded-xl flex-row items-center mr-3">
                <Text className="text-sm font-bold text-slate-700 mr-2">{selectedSite}</Text>
                <Filter size={14} color="#94a3b8" />
            </TouchableOpacity>
            <TouchableOpacity className="bg-slate-50 border border-slate-200 py-2.5 px-4 rounded-xl flex-row items-center mr-3">
                <Calendar size={14} color="#94a3b8" className="mr-2" />
                <Text className="text-sm font-bold text-slate-700">{selectedMonth}</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-purple-600 px-5 py-2.5 rounded-xl flex-row items-center">
                <Plus size={16} color="white" className="mr-2" />
                <Text className="text-sm font-bold text-white">Staff</Text>
            </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Grid Content */}
      <ScrollView className="flex-1">
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
                {/* Table Header */}
                <View className="flex-row bg-slate-50 border-b border-slate-200">
                    <View className="w-[180px] p-3 border-r border-slate-200">
                        <Text className="text-[11px] font-bold text-slate-500 uppercase">Employee</Text>
                    </View>
                    {days.map(day => (
                        <View key={day} className="w-[52px] p-2 border-r border-slate-100 items-center justify-center">
                            <Text className="text-slate-600 text-xs font-bold">{day}</Text>
                            <Text className="text-[9px] text-slate-400 font-medium">MON</Text>
                        </View>
                    ))}
                </View>

                {/* Table Body */}
                {filteredEmployees.map(emp => (
                    <View key={emp.id} className="flex-row border-b border-slate-100 h-16">
                        {/* Employee Column */}
                        <View className="w-[180px] p-3 border-r border-slate-200 flex-row items-center bg-white">
                            <View className="w-10 h-10 rounded-full bg-yellow-100 items-center justify-center mr-3 border border-yellow-200">
                                <Text className="text-sm font-bold text-slate-700">{emp.avatarSeed.substring(0,2).toUpperCase()}</Text>
                            </View>
                            <View>
                                <Text className="text-sm font-bold text-slate-800" numberOfLines={1}>{emp.name}</Text>
                                <Text className="text-[10px] text-slate-500 font-medium mt-0.5">{emp.site}</Text>
                            </View>
                        </View>

                        {/* Attendance Cells */}
                        {emp.attendance.map((record, index) => (
                            <View key={index} className="w-[52px] border-r border-slate-50 items-center justify-center">
                                {record.status === 'P' && record.imageUrl ? (
                                    <TouchableOpacity 
                                       onPress={() => setViewImage({ url: record.imageUrl!, employeeName: emp.name, date: `${index + 1} Dec 2025` })}
                                       className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200"
                                    >
                                        <Image source={{ uri: record.imageUrl }} className="w-full h-full" />
                                        <View className="absolute inset-0 bg-black/10 items-center justify-center">
                                            <Camera size={10} color="white" />
                                        </View>
                                    </TouchableOpacity>
                                ) : record.status === 'P' ? (
                                    <View className="w-6 h-6 rounded-full bg-green-50 items-center justify-center">
                                        <Text className="text-green-500 text-[10px] font-bold">P</Text>
                                    </View>
                                ) : record.status === 'A' ? (
                                    <View className="px-2 py-1 rounded bg-red-50 border border-red-100">
                                        <Text className="text-red-500 text-[10px] font-bold">Ab</Text>
                                    </View>
                                ) : (
                                    <Text className="text-slate-300 text-[10px] font-medium">WO</Text>
                                )}
                            </View>
                        ))}
                    </View>
                ))}
            </View>
        </ScrollView>
      </ScrollView>

      {/* Image Modal */}
      {viewImage && (
        <Modal transparent animationType="fade" visible={!!viewImage} onRequestClose={() => setViewImage(null)}>
            <View className="flex-1 bg-black/90 justify-center items-center">
                <TouchableOpacity className="absolute inset-0" onPress={() => setViewImage(null)} />
                <View className="w-[90%] bg-white rounded-3xl overflow-hidden mt-10">
                    <View className="px-4 py-3 border-b border-slate-100 flex-row justify-between items-center">
                        <View>
                            <Text className="font-bold text-slate-800">{viewImage.employeeName}</Text>
                            <Text className="text-xs text-slate-500">{viewImage.date}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setViewImage(null)} className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
                            <X size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                    <Image source={{ uri: viewImage.url }} className="w-full h-80 bg-black" resizeMode="contain" />
                    <View className="p-4 bg-slate-50 flex-row space-x-3">
                        <TouchableOpacity className="flex-1 bg-purple-600 py-4 rounded-xl items-center mr-2">
                            <Text className="text-white font-bold">Verify</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="flex-1 bg-white border border-slate-200 py-4 rounded-xl items-center ml-2">
                            <Text className="text-slate-700 font-bold">Report</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default AttendanceInterface;
