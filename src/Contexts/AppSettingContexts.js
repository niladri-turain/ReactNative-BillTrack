import AsyncStorage from '@react-native-async-storage/async-storage';
import {createContext, useContext, useEffect, useState} from 'react';

const AppSettingContexts = createContext();

const defautlSettings = {
  PRINT_ON_CREATE_BILL: false, //Automatically print bill when 'Print' button is pressed in create bill screen
  SEND_WHATSAPP_BILL_ON_CREATE_BILL: true, //Automatically send bill to whatsapp when 'Print' button is pressed in create bill screen
  SEND_TO_WHATSAPP: true, //Automatically send bill to whatsapp when 'Print' button is pressed in create bill screen
  SEND_TO_SMS: false, //Automatically send bill to sms when 'Print' button is pressed in create bill screen
};

const AppSettingProvider = ({children}) => {
  const [appSettings, setAppSettings] = useState(defautlSettings);

  const updateAppSettings = async (key, value) => {
    const newSettings = {...appSettings, [key]: value};
    setAppSettings(newSettings);
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
    } catch (err) {}
  };

  const resetSettings = async () => {
    try {
      await AsyncStorage.removeItem('appSettings');
      setAppSettings(defautlSettings);
    } catch (error) {}
  };

  const getByKey = key => {
    const value = appSettings[key];
    return value;
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSetting = await AsyncStorage.getItem('appSettings');
        if (savedSetting) {
          setAppSettings(JSON.parse(savedSetting));
        }
      } catch (error) {}
    };
    loadSettings();
  }, []);

  return (
    <AppSettingContexts.Provider
      value={{appSettings, updateAppSettings, resetSettings, getByKey}}>
      {children}
    </AppSettingContexts.Provider>
  );
};

const useAppSettings = () => {
  return useContext(AppSettingContexts);
};

const useAppSettingsValue = attribute => {
  const {appSettings} = useAppSettings();
  if (!appSettings) return null;
  if (!attribute) return appSettings;
  return appSettings[attribute];
};

export {useAppSettings, AppSettingProvider, useAppSettingsValue};
