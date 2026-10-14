import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

import type { PermissionStatus } from '../types/models';

type PermissionInfo = { status: PermissionStatus; blocked: boolean };
function toPermissionInfo(status: string, canAskAgain: boolean): PermissionInfo { return { status: status === 'granted' ? 'granted' : status === 'undetermined' ? 'undetermined' : canAskAgain ? 'denied' : 'blocked', blocked: status !== 'granted' && !canAskAgain }; }

async function getFreshCoordinates(): Promise<string | null> {
  // 1. Prioritize fresh current position with High accuracy (precise location)
  try {
    const currentPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 3500);
    });
    const fresh = await Promise.race([currentPromise, timeoutPromise]);
    if (fresh?.coords) {
      return `${fresh.coords.latitude.toFixed(4)}, ${fresh.coords.longitude.toFixed(4)}`;
    }
  } catch {
    // Current position query failed or timed out
  }

  // 2. Fallback to cached last known position
  try {
    const last = await Location.getLastKnownPositionAsync();
    if (last?.coords) {
      return `${last.coords.latitude.toFixed(4)}, ${last.coords.longitude.toFixed(4)}`;
    }
  } catch {
    // Fallback failed
  }

  return null;
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
        const coords = await getFreshCoordinates();
        if (coords) {
          setCoordinates(coords);
        }
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
        const coords = await getFreshCoordinates();
        if (coords) {
          setCoordinates(coords);
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let watcher: Location.LocationSubscription | null = null;

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
          const coords = await getFreshCoordinates();
          if (isMounted && coords) {
            setCoordinates(coords);
          }

          // Live location watcher: automatically updates coordinates when user moves or changes location
          watcher = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 1500,
              distanceInterval: 1,
            },
            (newPos) => {
              if (isMounted && newPos?.coords) {
                setCoordinates(
                  `${newPos.coords.latitude.toFixed(4)}, ${newPos.coords.longitude.toFixed(4)}`,
                );
              }
            },
          );

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
      watcher?.remove();
      subscription.remove();
    };
  }, [refresh]);

  return {
    location,
    notifications,
    coordinates,
    refresh,
    requestPermissions,
    openSettings: () => void Linking.openSettings(),
  };
}



