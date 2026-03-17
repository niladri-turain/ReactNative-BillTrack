import notify from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

class NotificationService {
  initialized = false;

  async init() {
    const fcm = await messaging().getToken();
    if (this.initialized) return;
    this.initialized = true;

    await notify.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: 4,
    });

    messaging().onMessage(async remoteMessage => {
      await notify.displayNotification({
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        android: {
          channelId: 'default',
          smallIcon: 'ic_launcher',
          largeIcon: 'ic_launcher',
        },
      });
    });
  }
}

export const notificationService = new NotificationService();
