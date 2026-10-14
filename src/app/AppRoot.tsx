import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppTabs } from '../navigation/AppTabs';
export function AppRoot() { return <SafeAreaProvider><NavigationContainer><StatusBar style="dark" /><AppTabs /></NavigationContainer></SafeAreaProvider>; }
