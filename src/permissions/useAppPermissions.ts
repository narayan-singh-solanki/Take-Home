import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

import type { PermissionStatus } from '../types/models';

type PermissionInfo = { status: PermissionStatus; blocked: boolean };
function toPermissionInfo(status: string, canAskAgain: boolean): PermissionInfo { return { status: status === 'granted' ? 'granted' : status === 'undetermined' ? 'undetermined' : canAskAgain ? 'denied' : 'blocked', blocked: status !== 'granted' && !canAskAgain }; }

async function getBestCoordinates(): Promise<string> {
  // 1. Try last known position first (fastest on real devices)
  try {
    const last = await Location.getLastKnownPositionAsync();
    if (last?.coords) {
      return `${last.coords.latitude.toFixed(3)}, ${last.coords.longitude.toFixed(3)}`;
    }
  } catch {
    // continue to current position
  }

  // 2. Try current position with lowest accuracy and 3s timeout
  try {
    const currentPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Lowest,
    });
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 3000);
    });
    const pos = await Promise.race([currentPromise, timeoutPromise]);
    if (pos?.coords) {
      return `${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`;
    }
  } catch {
    // continue to fallback
  }

  // 3. Fallback coordinates so user is never stuck on "Locating..."
  return '12.971, 77.594';
}

export function useAppPermissions() {
  const [location, setLocation] = useState<PermissionInfo>({ status: 'undetermined', blocked: false });
  const [notifications, setNotifications] = useState<PermissionInfo>({ status: 'undetermined', blocked: false });
  const [coordinates, setCoordinates] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [locationResponse, notificationResponse] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Notifications.getPermissionsAsync(),
      ]);
      const nextLocation = toPermissionInfo(locationResponse.status, locationResponse.canAskAgain);
      setLocation(nextLocation);
      setNotifications(toPermissionInfo(notificationResponse.status, notificationResponse.canAskAgain));
      if (nextLocation.status === 'granted') {
        const coords = await getBestCoordinates();
        setCoordinates(coords);
      } else {
        setCoordinates(null);
      }
    } catch {
      // Native permission APIs can be unavailable in unsupported clients
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('plazza', {
          name: 'Plazza updates',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }
      const [locationResponse, notificationResponse] = await Promise.all([
        Location.requestForegroundPermissionsAsync(),
        Notifications.requestPermissionsAsync(),
      ]);
      const nextLocation = toPermissionInfo(locationResponse.status, locationResponse.canAskAgain);
      setLocation(nextLocation);
      setNotifications(toPermissionInfo(notificationResponse.status, notificationResponse.canAskAgain));
      if (nextLocation.status === 'granted') {
        const coords = await getBestCoordinates();
        setCoordinates(coords);
      }
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('plazza', {
            name: 'Plazza updates',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }
        const [locationResponse, notificationResponse] = await Promise.all([
          Location.requestForegroundPermissionsAsync(),
          Notifications.requestPermissionsAsync(),
        ]);
        if (!isMounted) return;
        const nextLocation = toPermissionInfo(locationResponse.status, locationResponse.canAskAgain);
        setLocation(nextLocation);
        setNotifications(toPermissionInfo(notificationResponse.status, notificationResponse.canAskAgain));
        if (nextLocation.status === 'granted') {
          const coords = await getBestCoordinates();
          if (isMounted) {
            setCoordinates(coords);
          }
        }
      } catch {
        // Native permission APIs can be unavailable in unsupported clients
      }
    }

    void init();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refresh();
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [refresh]);

  return {
    location,
    notifications,
    coordinates,
    requestPermissions,
    openSettings: () => void Linking.openSettings(),
  };
}


