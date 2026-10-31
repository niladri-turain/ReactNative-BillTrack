import {NativeEventEmitter, NativeModules, Platform} from 'react-native';

const smsConsentModule = NativeModules.SmsUserConsent;
const smsConsentEmitter =
  Platform.OS === 'android' && smsConsentModule
    ? new NativeEventEmitter(smsConsentModule)
    : null;
let smsSubscription;
let pendingOtp = null;
const otpCallbacks = new Set();

const handleSms = event => {
  const message = event?.message;
  if (typeof message !== 'string') return;

  const code = message.match(/\b\d{4}\b/)?.[0];
  if (!code) return;

  pendingOtp = code;
  otpCallbacks.forEach(callback => callback(code));
};

export const startOtpSmsConsent = async () => {
  if (Platform.OS !== 'android') return;

  pendingOtp = null;
  if (!smsConsentModule || !smsConsentEmitter) {
    throw new Error('Android SMS User Consent module is not available');
  }
  if (!smsSubscription) {
    smsSubscription = smsConsentEmitter.addListener(
      'SmsUserConsentMessage',
      handleSms,
    );
  }
  await smsConsentModule.startListening();
};

export const subscribeToOtp = callback => {
  otpCallbacks.add(callback);
  if (pendingOtp) callback(pendingOtp);
  return () => otpCallbacks.delete(callback);
};

export const stopOtpSmsConsent = async () => {
  if (smsSubscription?.remove) smsSubscription.remove();
  smsSubscription = null;
  pendingOtp = null;
  otpCallbacks.clear();

  if (Platform.OS === 'android' && smsConsentModule) {
    await smsConsentModule.stopListening();
  }
};
