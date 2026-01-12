
import './global.css';
import React, { useState } from 'react';
import { View as RNView, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { View as ViewState } from './src/types';
import Dashboard from './src/components/Dashboard';
import NavBar from './src/components/NavBar';
import AttendanceInterface from './src/components/AttendanceInterface';
import ProfitLossInterface from './src/components/ProfitLossInterface';
import BillsInterface from './src/components/BillsInterface';
import AdvanceInterface from './src/components/AdvanceInterface';
import LiveVoice from './src/components/LiveVoice';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);

  const renderView = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard onViewChange={setCurrentView} />;
      case ViewState.ATTENDANCE:
        return <AttendanceInterface onBack={() => setCurrentView(ViewState.DASHBOARD)} />;
      case ViewState.PROFIT_LOSS:
        return <ProfitLossInterface onBack={() => setCurrentView(ViewState.DASHBOARD)} />;
      case ViewState.BILLS:
        return <BillsInterface onBack={() => setCurrentView(ViewState.DASHBOARD)} />;
      case ViewState.ADVANCE:
        return <AdvanceInterface onBack={() => setCurrentView(ViewState.DASHBOARD)} />;
      case ViewState.LIVE_VOICE:
        return <LiveVoice onBack={() => setCurrentView(ViewState.DASHBOARD)} />;
      default:
        return <Dashboard onViewChange={setCurrentView} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <RNView style={styles.content}>
        {renderView()}
      </RNView>
      {currentView === ViewState.DASHBOARD || currentView === ViewState.ATTENDANCE || currentView === ViewState.LIVE_VOICE ? (
         <NavBar currentView={currentView} onViewChange={setCurrentView} />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F5F9',
  },
  content: {
    flex: 1,
  },
});

export default App;


