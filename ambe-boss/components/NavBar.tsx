import React from 'react';
import { View } from '../types';

interface NavBarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const NavBar: React.FC<NavBarProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full h-24 glass-panel rounded-t-[30px] flex items-center justify-evenly px-6 z-50">
      <button
        onClick={() => onViewChange(View.DASHBOARD)}
        className={`flex flex-col items-center justify-center transition-all duration-300 w-16`}
      >
        <i className={`fa-solid fa-house ${currentView === View.DASHBOARD ? 'text-purple-600' : 'text-slate-400'} text-xl mb-1`}></i>
        <span className={`text-[11px] font-medium ${currentView === View.DASHBOARD ? 'text-purple-600' : 'text-slate-400'}`}>
          Home
        </span>
      </button>

      <button
        onClick={() => onViewChange(View.LIVE_VOICE)}
        className="flex flex-col items-center justify-center -mt-10"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 flex items-center justify-center border-4 border-[#F3F5F9] transform transition-transform active:scale-95">
           <i className="fa-solid fa-microphone text-white text-2xl"></i>
        </div>
        <span className="text-[11px] font-medium text-slate-500 mt-2">Voice</span>
      </button>

      <button
        onClick={() => onViewChange(View.ATTENDANCE)}
        className={`flex flex-col items-center justify-center transition-all duration-300 w-16`}
      >
        <i className={`fa-solid fa-clipboard-user ${currentView === View.ATTENDANCE ? 'text-purple-600' : 'text-slate-400'} text-xl mb-1`}></i>
        <span className={`text-[11px] font-medium ${currentView === View.ATTENDANCE ? 'text-purple-600' : 'text-slate-400'}`}>
          Attendance
        </span>
      </button>
    </div>
  );
};

export default NavBar;