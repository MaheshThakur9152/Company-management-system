
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { User, Mic2, ClipboardList, LineChart, FileText, HandCoins } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { View as ViewState } from '../types';

interface DashboardProps {
  onViewChange: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const currentTime = new Date();
  const hours = currentTime.getHours();
  let greeting = 'Good Morning';
  if (hours >= 12 && hours < 17) greeting = 'Good Afternoon';
  else if (hours >= 17) greeting = 'Good Evening';

  return (
    <SafeAreaView className="flex-1 bg-[#F3F5F9]">
      <ScrollView className="px-6 pt-12 space-y-8">
        {/* Header */}
        <View className="flex-row justify-between items-start">
          <View>
            <Text className="text-slate-500 font-medium text-lg">{greeting}</Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-3xl font-bold text-slate-800">Hello, </Text>
              <Text className="text-3xl font-bold text-purple-600">Hari Sir</Text>
            </View>
          </View>
          <LinearGradient
            colors={['#a855f7', '#ec4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="w-12 h-12 rounded-full p-0.5"
          >
            <View className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
              <User size={24} color="#94a3b8" />
            </View>
          </LinearGradient>
        </View>

        {/* Main Status Card */}
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mt-8">
          <Text className="text-xs font-bold text-purple-600 mb-2 tracking-wider uppercase">System Status</Text>
          <View className="flex-row items-center space-x-2 mb-4">
            <View className="h-3 w-3 rounded-full bg-green-500 mr-2" />
            <Text className="text-2xl font-bold text-slate-800">Ambe Boss Online</Text>
          </View>
          <Text className="text-slate-500 text-sm mb-6 leading-relaxed">
            I am ready to assist you with your daily tasks, Hari Sir.
          </Text>
          <TouchableOpacity 
            onPress={() => onViewChange(ViewState.LIVE_VOICE)}
            className="w-full bg-slate-900 rounded-xl py-4 shadow-lg flex-row items-center justify-center space-x-2"
          >
            <Mic2 size={20} color="#d8b4fe" />
            <Text className="text-white font-medium ml-2">Start Voice Command</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions Grid */}
        <View className="mt-8 pb-32">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-xl font-bold text-slate-800">Quick Actions</Text>
            <TouchableOpacity>
              <Text className="text-xs font-semibold text-purple-600">See All</Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row flex-wrap justify-between">
            {/* Attendance */}
            <TouchableOpacity 
              onPress={() => onViewChange(ViewState.ATTENDANCE)}
              style={{ width: '48%' }}
              className="bg-white p-5 rounded-3xl mb-4 shadow-sm border border-slate-100"
            >
              <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center mb-3">
                <ClipboardList size={24} color="#3b82f6" />
              </View>
              <Text className="font-bold text-slate-800">Attendance</Text>
              <Text className="text-xs text-slate-500 mt-1">View staff grid</Text>
            </TouchableOpacity>

            {/* Profit or Loss */}
            <TouchableOpacity 
              onPress={() => onViewChange(ViewState.PROFIT_LOSS)}
              style={{ width: '48%' }}
              className="bg-white p-5 rounded-3xl mb-4 shadow-sm border border-slate-100"
            >
              <View className="w-12 h-12 rounded-full bg-green-50 items-center justify-center mb-3">
                <LineChart size={24} color="#22c55e" />
              </View>
              <Text className="font-bold text-slate-800">Profit or Loss</Text>
              <Text className="text-xs text-slate-500 mt-1">Financial report</Text>
            </TouchableOpacity>

            {/* Bills Status */}
            <TouchableOpacity 
              onPress={() => onViewChange(ViewState.BILLS)}
              style={{ width: '48%' }}
              className="bg-white p-5 rounded-3xl mb-4 shadow-sm border border-slate-100"
            >
              <View className="w-12 h-12 rounded-full bg-orange-50 items-center justify-center mb-3">
                <FileText size={24} color="#f97316" />
              </View>
              <Text className="font-bold text-slate-800">Bills Status</Text>
              <Text className="text-xs text-slate-500 mt-1">Paid & Unpaid</Text>
            </TouchableOpacity>

            {/* Advance */}
            <TouchableOpacity 
              onPress={() => onViewChange(ViewState.ADVANCE)}
              style={{ width: '48%' }}
              className="bg-white p-5 rounded-3xl mb-4 shadow-sm border border-slate-100"
            >
              <View className="w-12 h-12 rounded-full bg-indigo-50 items-center justify-center mb-3">
                <HandCoins size={24} color="#6366f1" />
              </View>
              <Text className="font-bold text-slate-800">Advance</Text>
              <Text className="text-xs text-slate-500 mt-1">Per employee</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;
