
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Mic, ClipboardList } from 'lucide-react-native';
import { View as ViewState } from '../types';

interface NavBarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}

const NavBar: React.FC<NavBarProps> = ({ currentView, onViewChange }) => {
  return (
    <View className="absolute bottom-0 left-0 w-full h-24 bg-white/80 rounded-t-[30px] flex-row items-center justify-around px-6 pb-4">
      <TouchableOpacity
        onPress={() => onViewChange(ViewState.DASHBOARD)}
        className="items-center justify-center w-16"
      >
        <Home 
          size={24} 
          color={currentView === ViewState.DASHBOARD ? '#9333ea' : '#94a3b8'} 
        />
        <Text className={`text-[11px] font-medium mt-1 ${currentView === ViewState.DASHBOARD ? 'text-purple-600' : 'text-slate-400'}`}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onViewChange(ViewState.LIVE_VOICE)}
        className="items-center justify-center -mt-10"
      >
        <View className="w-16 h-16 rounded-full bg-purple-600 shadow-lg flex items-center justify-center border-4 border-[#F3F5F9]">
          <Mic size={28} color="white" />
        </View>
        <Text className="text-[11px] font-medium text-slate-500 mt-2">Voice</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onViewChange(ViewState.ATTENDANCE)}
        className="items-center justify-center w-16"
      >
        <ClipboardList 
          size={24} 
          color={currentView === ViewState.ATTENDANCE ? '#9333ea' : '#94a3b8'} 
        />
        <Text className={`text-[11px] font-medium mt-1 ${currentView === ViewState.ATTENDANCE ? 'text-purple-600' : 'text-slate-400'}`}>
          Attendance
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default NavBar;
