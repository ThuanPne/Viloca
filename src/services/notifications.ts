import { Platform } from 'react-native';

// expo-notifications requires native code — not available in Expo Go (SDK 53+)
let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
} catch {}

export async function setupNotifications(): Promise<void> {
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('nearby', {
      name: 'Địa điểm gần bạn',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#45611b',
    });
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function sendNearbyLocationNotification(
  locationNames: string[],
): Promise<void> {
  if (!Notifications || !locationNames.length) return;

  const body =
    locationNames.length === 1
      ? `Bạn có biết ${locationNames[0]} không?`
      : `${locationNames[0]} và ${locationNames.length - 1} nơi khác đang gần bạn`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Địa điểm thú vị gần bạn 📍',
      body,
      data: { type: 'nearby' },
      ...(Platform.OS === 'android' && { channelId: 'nearby' }),
    },
    trigger: null,
  });
}
