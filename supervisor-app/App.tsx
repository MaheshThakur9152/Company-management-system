import React, { useState } from 'react';
import { View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './screens/LoginScreen';
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
          <SupervisorScreen
            onLogout={handleLogout}
            assignedSiteId={user.assignedSites?.[0] || ''}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}
