import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from 'react-native-splash-screen';
import {ToastAndroid} from 'react-native';
import {deviceService} from '../Services/DeviceService';
import {getDeviceDetails} from '../utils/DeviceInfo';
import webHook from '../utils/WebHook';
import {subscriptionService} from '../Services/SubscriptionService';
import {useNetworkContext} from './NetworkContext';

const AuthContext = createContext();

const AuthProvider = ({children}) => {
  const [authToken, setAuthToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [business, setBusiness] = useState(null);
  const [subscription, setSubscription] = useState(null);

  const isOnline = useNetworkContext('isOnline');

  const login = async (token, user = {}) => {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.multiSet([
        ['token', token],
        ['user', JSON.stringify(user)],
      ]);
      setUser(user);
      setAuthToken(token);
    } catch (error) {}
  };

  const setUserData = async userData => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {}
  };

  const setBusinessData = async businessData => {
    try {
      await AsyncStorage.setItem('business', JSON.stringify(businessData));
      setBusiness(businessData);
    } catch (error) {}
  };

  const resetBusiness = async (newBusinessData = null) => {
    try {
      // remove old business details
      await AsyncStorage.removeItem('business');

      // if new business details are provided, save them
      if (newBusinessData) {
        await AsyncStorage.setItem('business', JSON.stringify(newBusinessData));
        setBusiness(newBusinessData);
      } else {
        setBusiness(null);
      }
    } catch (error) {}
  };

  const updateNumberOfInvoices = async number => {
    try {
      await AsyncStorage.setItem(
        'business',
        JSON.stringify({...business, numberOfInvoices: number}),
      );
      setBusiness({...business, numberOfInvoices: number});
    } catch (error) {}
  };

  const logout = async () => {
    try {
      const {deviceUniqueKey} = await getDeviceDetails();
      const data = await deviceService.removeDevice({
        deviceUniqueKey: deviceUniqueKey,
      });
      if (data?.status) {
        await AsyncStorage.multiRemove(['token', 'user', 'business']);
        await AsyncStorage.clear();
        setAuthToken(null);
        setUser(null);
        setSubscription(null);
        setBusiness(null);
      } else {
        ToastAndroid.show(data?.message, ToastAndroid.LONG);
      }
    } catch (error) {}
  };

  const check = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const businessStr = await AsyncStorage.getItem('business');
      setAuthToken(token);
      setUser(JSON.parse(userStr));
      setBusiness(JSON.parse(businessStr));
    } catch (error) {
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        SplashScreen.hide();
      }, 100);
    }
  };

  const deviceVerification = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const data = await webHook.verifyDevice();
        if (!data?.status) {
          await logout();
        }
      }
    } catch (error) {}
  };

  const subscriptionCheck = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const subscriptionData = await AsyncStorage.getItem('subscription');
        if (subscriptionData && subscription !== null) {
          const parsedSubscription = JSON.parse(subscriptionData);
          const endDate = new Date(parsedSubscription?.endDate);
          const currentDate = new Date();
          if (endDate > currentDate) {
            const isPremiumPlanAndActive =
              (parsedSubscription?.plan === 'pro' ||
                parsedSubscription?.plan === 'basic') &&
              endDate > currentDate;
            const settableSubscription = {
              ...parsedSubscription,
              isActive: endDate > currentDate,
              isPremiumPlanAndActive,
            };
            setSubscription(settableSubscription);
          } else {
            await AsyncStorage.removeItem('subscription');
            setSubscription({
              plan: 'na',
              isActive: false,
              isPremiumPlanAndActive: false,
            });
          }
        } else {
          const currentSubscription =
            await subscriptionService.currentSubscription(token);
          if (currentSubscription?.status) {
            const endDate = new Date(currentSubscription?.data?.endDate);
            const currentDate = new Date();
            const isPremiumPlanAndActive =
              (currentSubscription?.data?.plan === 'pro' ||
                currentSubscription?.data?.plan === 'basic') &&
              endDate > currentDate;
            const settableSubscription = {
              ...currentSubscription?.data,
              isActive: endDate > currentDate,
              isPremiumPlanAndActive,
            };
            setSubscription(settableSubscription);
            await AsyncStorage.setItem(
              'subscription',
              JSON.stringify(settableSubscription),
            );
          } else {
            await AsyncStorage.removeItem('subscription');
            setSubscription({
              plan: 'na',
              isActive: false,
              isPremiumPlanAndActive: false,
            });
          }
        }
      }
    } catch (error) {}
  };

  const resetSubscription = async (subscriptionData = null) => {
    try {
      await AsyncStorage.setItem(
        'subscription',
        JSON.stringify(subscriptionData),
      );
      const endDate = new Date(subscriptionData?.endDate);
      const currentDate = new Date();
      const isPremiumPlanAndActive =
        (subscriptionData?.plan === 'pro' ||
          subscriptionData?.plan === 'basic') &&
        endDate > currentDate;
      const settableSubscription = {
        ...subscriptionData,
        isActive: endDate > currentDate,
        isPremiumPlanAndActive,
      };
      setSubscription(settableSubscription);
    } catch (error) {}
  };

  useEffect(() => {
    if (isOnline) {
      check();
      deviceVerification();
      subscriptionCheck();
    }
  }, [isOnline]);

  useEffect(() => {
    if (authToken) {
      subscriptionCheck();
    }
  }, [authToken]);

  const value = useMemo(() => {
    return {
      authToken,
      login,
      logout,
      user,
      setUserData,
      setBusinessData,
      business,
      resetBusiness,
      subscription,
      resetSubscription,
      updateNumberOfInvoices
    };
  }, [authToken, user, business, subscription]);

  if (isLoading) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export const useAuthToken = () => {
  const {authToken} = useAuth();
  return authToken;
};

export const useSubscription = attribute => {
  const {subscription} = useAuth();
  if (!subscription) return null;
  if (!attribute) return subscription;
  return subscription?.[attribute];
};

export const useUser = attribute => {
  const {user} = useAuth();
  if (!user) return null;
  if (!attribute) return user;
  return user?.[attribute];
};

export const useBusiness = key => {
  const {business} = useAuth();

  if (!business) return null;

  if (!key) return business;

  return business?.[key];
};

export const useUpdateUserFields = () => {
  const {user, setUserData} = useAuth();

  const updateUserFields = async (fields = {}) => {
    if (!fields) return;
    try {
      const updatedUser = {...(user || {}), ...fields};
      await setUserData(updatedUser);
    } catch (error) {}
  };
  return updateUserFields;
};

export const useGstEnabled = () => {
  const {business} = useAuth();
  return Boolean(business?.gstNumber);
};

export default AuthProvider;
