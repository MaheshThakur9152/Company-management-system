import React, { useState } from 'react';
import { View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './screens/LoginScreen';
import BossScreen from './screens/BossScreen';
import AdminScreen from './screens/AdminScreen';
import SupervisorScreen from './screens/SupervisorScreen';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={{ flex: 1 }}>
        {!user ? (
          <LoginScreen onLogin={handleLogin} />
        ) : (
          <>
            {user.role === 'admin' && <AdminScreen onLogout={handleLogout} />}
            {user.role === 'boss' && <BossScreen onLogout={handleLogout} user={user} />}
            {user.role === 'supervisor' && (
              <SupervisorScreen 
                onLogout={handleLogout} 
                assignedSiteId={user.assignedSites && user.assignedSites.length > 0 ? user.assignedSites[0] : ''} 
              />
            )}
          </>
        )}
      </View>
    </SafeAreaProvider>
  );
}
