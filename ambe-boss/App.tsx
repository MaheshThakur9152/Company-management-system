
import React, { useState } from 'react';
import { View } from './types';
import Dashboard from './components/Dashboard';
import AttendanceInterface from './components/AttendanceInterface';
import LiveVoice from './components/LiveVoice';
import NavBar from './components/NavBar';
import ProfitLossInterface from './components/ProfitLossInterface';
import BillsInterface from './components/BillsInterface';
import AdvanceInterface from './components/AdvanceInterface';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);

  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard onViewChange={setCurrentView} />;
      case View.ATTENDANCE:
        return <AttendanceInterface onBack={() => setCurrentView(View.DASHBOARD)} />;
      case View.PROFIT_LOSS:
        return <ProfitLossInterface onBack={() => setCurrentView(View.DASHBOARD)} />;
      case View.BILLS:
        return <BillsInterface onBack={() => setCurrentView(View.DASHBOARD)} />;
      case View.ADVANCE:
        return <AdvanceInterface onBack={() => setCurrentView(View.DASHBOARD)} />;
      case View.LIVE_VOICE:
        return <LiveVoice onBack={() => setCurrentView(View.DASHBOARD)} />;
      default:
        return <Dashboard onViewChange={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F5F9] text-slate-800 relative overflow-hidden flex flex-col">
      {/* Background Ambient Gradients - Light Mode */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-200/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-pink-200/40 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden z-10 pb-24">
        {renderView()}
      </main>

      {/* Persistent Bottom Navigation */}
      <NavBar currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
};

export default App;
