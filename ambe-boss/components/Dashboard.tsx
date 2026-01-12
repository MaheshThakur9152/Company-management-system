
import React from 'react';
import { View } from '../types';

interface DashboardProps {
  onViewChange: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const currentTime = new Date();
  const hours = currentTime.getHours();
  let greeting = 'Good Morning';
  if (hours >= 12 && hours < 17) greeting = 'Good Afternoon';
  else if (hours >= 17) greeting = 'Good Evening';

  return (
    <div className="p-6 pt-12 flex flex-col h-full space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-slate-500 font-medium text-lg">{greeting}</h2>
          <h1 className="text-3xl font-bold mt-1 text-slate-800">
            Hello, <span className="gradient-text">Hari Sir</span>
          </h1>
        </div>
        <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-r from-purple-500 to-pink-500">
           <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
             <i className="fa-solid fa-user text-slate-400"></i>
           </div>
        </div>
      </div>

      {/* Main Status Card */}
      <div className="bg-white rounded-3xl p-6 relative overflow-hidden group shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-slate-100">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="relative z-10">
          <p className="text-xs font-bold text-purple-600 mb-2 tracking-wider uppercase">System Status</p>
          <div className="flex items-center space-x-2 mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-2xl font-bold text-slate-800">Ambe Boss Online</span>
          </div>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            I am ready to assist you with your daily tasks, Hari Sir.
          </p>
          <button 
            onClick={() => onViewChange(View.LIVE_VOICE)}
            className="w-full bg-slate-900 text-white hover:bg-slate-800 transition-colors py-3.5 rounded-xl shadow-lg shadow-slate-200 flex items-center justify-center space-x-2"
          >
            <i className="fa-solid fa-microphone-lines text-purple-300"></i>
            <span className="font-medium">Start Voice Command</span>
          </button>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-slate-800">Quick Actions</h3>
          <button className="text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors">See All</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => onViewChange(View.ATTENDANCE)}
            className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col items-start space-y-3 transition-all text-left bg-white"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <i className="fa-solid fa-clipboard-user text-xl"></i>
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Attendance</h4>
              <p className="text-xs text-slate-500 mt-1 font-medium">View staff grid</p>
            </div>
          </button>

          <button 
            onClick={() => onViewChange(View.PROFIT_LOSS)}
            className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col items-start space-y-3 transition-all text-left bg-white"
          >
             <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500">
              <i className="fa-solid fa-chart-line text-xl"></i>
            </div>
             <div>
              <h4 className="font-bold text-slate-800">Profit or Loss</h4>
              <p className="text-xs text-slate-500 mt-1 font-medium">Financial report</p>
            </div>
          </button>

           <button 
            onClick={() => onViewChange(View.BILLS)}
            className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col items-start space-y-3 transition-all text-left bg-white"
          >
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
              <i className="fa-solid fa-file-invoice-dollar text-xl"></i>
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Bills Status</h4>
              <p className="text-xs text-slate-500 mt-1 font-medium">Paid & Unpaid</p>
            </div>
          </button>

          <button 
            onClick={() => onViewChange(View.ADVANCE)}
             className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col items-start space-y-3 transition-all text-left bg-white"
          >
             <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
              <i className="fa-solid fa-hand-holding-dollar text-xl"></i>
            </div>
             <div>
              <h4 className="font-bold text-slate-800">Advance</h4>
              <p className="text-xs text-slate-500 mt-1 font-medium">Per employee</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
