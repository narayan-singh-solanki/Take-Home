import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CartScreen } from '../features/cart/screens/CartScreen';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { useCart } from '../app/providers/CartProvider';
import { colors } from '../theme';

export type AppTabParamList = { Home: undefined; Cart: undefined };

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppTabs() {
  const { itemCount } = useCart();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, color: '#FFFFFF', fontSize: 11 },
        }}
      />
    </Tab.Navigator>
  );
}

