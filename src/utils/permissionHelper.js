import {PermissionsAndroid} from 'react-native';

export const requestNotificationPermission = async () => {
  try {
    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );

    if (hasPermission) {
      return true;
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      {
        title: 'Notification Permission',
        message: 'Allow notifications to stay updated',
      },
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    return false;
  }
};
