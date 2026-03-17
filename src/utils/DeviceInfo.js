import messaging from '@react-native-firebase/messaging';
import DeviceInfo from 'react-native-device-info';

export const getDeviceDetails = async () => {
  const fcmToken = await messaging().getToken();

  const [deviceType, deviceModel, deviceName, deviceUniqueKey] =
    await Promise.all([
      DeviceInfo.getDeviceType(),
      DeviceInfo.getModel(),
      DeviceInfo.getDeviceName(),
      DeviceInfo.getUniqueId(),
    ]);

  return {
    fcmToken,
    deviceModel,
    deviceName,
    deviceUniqueKey,
    deviceType,
  };
};
