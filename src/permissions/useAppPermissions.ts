import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

import type { PermissionStatus } from '../types/models';

type PermissionInfo = { status: PermissionStatus; blocked: boolean };
function toPermissionInfo(status: string, canAskAgain: boolean): PermissionInfo { return { status: status === 'granted' ? 'granted' : status === 'undetermined' ? 'undetermined' : canAskAgain ? 'denied' : 'blocked', blocked: status !== 'granted' && !canAskAgain }; }

export function useAppPermissions() {
  const [location, setLocation] = useState<PermissionInfo>({ status: 'undetermined', blocked: false });
  const [notifications, setNotifications] = useState<PermissionInfo>({ status: 'undetermined', blocked: false });
  const [coordinates, setCoordinates] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [locationResponse, notificationResponse] = await Promise.all([Location.getForegroundPermissionsAsync(), Notifications.getPermissionsAsync()]);
      const nextLocation = toPermissionInfo(locationResponse.status, locationResponse.canAskAgain);
      setLocation(nextLocation); setNotifications(toPermissionInfo(notificationResponse.status, notificationResponse.canAskAgain));
      if (nextLocation.status === 'granted') {
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoordinates(`${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}`);
      }
    } catch { /* Native permission APIs can be unavailable in unsupported clients. */ }
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('plazza', { name: 'Plazza updates', importance: Notifications.AndroidImportance.DEFAULT });
      const [locationResponse, notificationResponse] = await Promise.all([Location.requestForegroundPermissionsAsync(), Notifications.requestPermissionsAsync()]);
      setLocation(toPermissionInfo(locationResponse.status, locationResponse.canAskAgain));
      setNotifications(toPermissionInfo(notificationResponse.status, notificationResponse.canAskAgain));
      await refresh();
    } catch { /* The on-screen statuses remain usable if an API call fails. */ }
  }, [refresh]);

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
          const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (isMounted) {
            setCoordinates(`${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}`);
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

