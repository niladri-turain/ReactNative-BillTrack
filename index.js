/**
 * @format
 */

import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notify from '@notifee/react-native';
import App from './src/App';
import {name as appName} from './app.json';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  await notify.displayNotification({
    title: remoteMessage.notification?.title,
    body: remoteMessage.notification?.body,
    android: {
      channelId: 'default',
      smallIcon: 'ic_launcher',
    },
  });
});

AppRegistry.registerComponent(appName, () => App);
