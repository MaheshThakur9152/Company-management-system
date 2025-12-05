import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, usePathname, useRootNavigationState } from 'expo-router';

export const NAVIGATION_STATE_KEY = 'EXPO_ROUTER_NAVIGATION_STATE';

export function useNavigationPersistence() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const rootNavigationState = useRootNavigationState();

  // Restore state on mount
  useEffect(() => {
    // Wait for navigation to be ready
    if (!rootNavigationState?.key) return;

    const restoreState = async () => {
      try {
        const savedPath = Platform.OS === 'web' 
          ? localStorage.getItem(NAVIGATION_STATE_KEY) 
          : await AsyncStorage.getItem(NAVIGATION_STATE_KEY);

        console.log('[NavigationPersistence] Restoring path:', savedPath);

        if (savedPath) {
           router.replace(savedPath);
        }
      } catch (e) {
        console.warn('[NavigationPersistence] Failed to restore state', e);
      } finally {
        setIsReady(true);
      }
    };

    restoreState();
  }, [rootNavigationState?.key]);

  // Save state on change
  useEffect(() => {
    if (!isReady || !pathname) return;

    const saveState = async () => {
      try {
        if (Platform.OS === 'web') {
          localStorage.setItem(NAVIGATION_STATE_KEY, pathname);
        } else {
          await AsyncStorage.setItem(NAVIGATION_STATE_KEY, pathname);
        }
      } catch (e) {
        console.warn('[NavigationPersistence] Failed to save state', e);
      }
    };

    saveState();
  }, [pathname, isReady]);

  return isReady;
}
