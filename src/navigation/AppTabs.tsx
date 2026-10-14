import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';
import { useCart } from '../app/providers/CartProvider';
import { CartScreen } from '../features/cart/screens/CartScreen';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { colors } from '../theme';

export type AppTabParamList = { Home: undefined; Cart: undefined };

const Tab = createBottomTabNavigator<AppTabParamList>();

function HomeTabIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <View style={styles.iconContainer}>
      {/* Roof */}
      <View style={[styles.roof, { borderBottomColor: color }]} />
      {/* House Body */}
      <View
        style={[
          styles.houseBody,
          {
            borderColor: color,
            backgroundColor: focused ? color : 'transparent',
          },
        ]}
      >
        <View
          style={[
            styles.door,
            { backgroundColor: focused ? '#FFFFFF' : color },
          ]}
        />
      </View>
    </View>
  );
}

function CartTabIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <View style={styles.iconContainer}>
      {/* Cart Basket */}
      <View
        style={[
          styles.cartBasket,
          {
            borderColor: color,
            backgroundColor: focused ? color : 'transparent',
          },
        ]}
      >
        {/* Subtle grid or cross inside basket */}
        <View
          style={[
            styles.basketAccent,
            { backgroundColor: focused ? '#FFFFFF' : color },
          ]}
        />
      </View>
      {/* Wheels */}
      <View style={styles.wheelsRow}>
        <View style={[styles.wheel, { backgroundColor: color }]} />
        <View style={[styles.wheel, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

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
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 58,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <HomeTabIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <CartTabIcon color={color} focused={focused} />
          ),
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.primary,
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: '700',
          },
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 26,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roof: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 8,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  houseBody: {
    width: 15,
    height: 11,
    borderWidth: 2,
    borderTopWidth: 0,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  door: {
    width: 4,
    height: 6,
    borderTopLeftRadius: 1.5,
    borderTopRightRadius: 1.5,
  },
  cartBasket: {
    width: 18,
    height: 12,
    borderWidth: 2,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basketAccent: {
    width: 6,
    height: 2,
    borderRadius: 1,
  },
  wheelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 12,
    marginTop: 2,
  },
  wheel: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
  },
});
