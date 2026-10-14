import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppTabs } from '../navigation/AppTabs';
import { CartProvider } from './providers/CartProvider';

export function AppRoot() {
  return (
    <SafeAreaProvider>
      <CartProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <AppTabs />
        </NavigationContainer>
      </CartProvider>
    </SafeAreaProvider>
  );
}
