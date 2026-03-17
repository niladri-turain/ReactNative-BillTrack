import {createContext, useContext, useEffect, useState} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {Alert} from 'react-native';

const NetworkContext = createContext();

const NetworkProvider = ({children}) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected;
      const reachable = state.isInternetReachable;
      setIsConnected(connected);
      setIsInternetReachable(reachable);

      if (!connected || !reachable) {
        Alert.alert(
          'No Internet Connection',
          'Please check your internet connection and try again.',
          [{text: 'OK'}],
        );
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const value = {
    isOnline: isConnected && isInternetReachable,
  };

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
};

export const useNetworkContext = attribute => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetworkContext must be used within a NetworkProvider');
  }
  if (attribute) {
    return context[attribute];
  }
  return context;
};

export default NetworkProvider;
