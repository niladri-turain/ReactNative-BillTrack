import AsyncStorage from '@react-native-async-storage/async-storage';
import {createContext, useContext, useEffect, useRef, useState} from 'react';
import {useSubscription} from './AuthContext';

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

  // SEND_TO_WHATSAPP always follows the current plan's WHATSAPP_SHARING
  // entitlement — the user cannot flip it manually (see AppSettings.jsx,
  // where that switch is rendered as `disabled`).
  //
  // PRINT_ON_CREATE_BILL / SEND_TO_SMS instead only get force-set by the
  // BILL_PRINTING / SMS_SENDING entitlements: forced OFF (and locked) when
  // the entitlement is missing, and defaulted ON the moment the entitlement
  // is (re)granted during this app session — after that the user is free to
  // toggle them manually (see AppSettings.jsx `locked={printLocked}` /
  // `locked={smsLocked}`) without this effect overriding their choice again.
  const entitlements = useSubscription('entitlements');
  const prevEntitlementsRef = useRef({billPrinting: false, smsSending: false});

  useEffect(() => {
    if (!entitlements) return;
    const billPrinting = !!entitlements?.BILL_PRINTING?.enabled;
    const smsSending = !!entitlements?.SMS_SENDING?.enabled;
    const whatsappSharing = !!entitlements?.WHATSAPP_SHARING?.enabled;
    const {billPrinting: prevBillPrinting, smsSending: prevSmsSending} =
      prevEntitlementsRef.current;
    prevEntitlementsRef.current = {billPrinting, smsSending};

    setAppSettings(prev => {
      const next = {...prev};
      let changed = false;

      if (prev.SEND_TO_WHATSAPP !== whatsappSharing) {
        next.SEND_TO_WHATSAPP = whatsappSharing;
        changed = true;
      }

      if (!billPrinting && prev.PRINT_ON_CREATE_BILL !== false) {
        next.PRINT_ON_CREATE_BILL = false;
        changed = true;
      } else if (billPrinting && !prevBillPrinting) {
        next.PRINT_ON_CREATE_BILL = true;
        changed = true;
      }

      if (!smsSending && prev.SEND_TO_SMS !== false) {
        next.SEND_TO_SMS = false;
        changed = true;
      } else if (smsSending && !prevSmsSending) {
        next.SEND_TO_SMS = true;
        changed = true;
      }

      if (!changed) return prev;
      AsyncStorage.setItem('appSettings', JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [entitlements]);

  const billPrintingEnabled = !!entitlements?.BILL_PRINTING?.enabled;
  const smsSendingEnabled = !!entitlements?.SMS_SENDING?.enabled;

  return (
    <AppSettingContexts.Provider
      value={{
        appSettings,
        updateAppSettings,
        resetSettings,
        getByKey,
        printLocked: !billPrintingEnabled,
        smsLocked: !smsSendingEnabled,
      }}>
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
