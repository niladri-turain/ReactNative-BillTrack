import {Platform} from 'react-native';

let smsSubscription;
let pendingOtp = null;
const otpCallbacks = new Set();

const handleSms = event => {
  if (typeof event !== 'string' || event === 'Timeout Error.') return;

  const code = event.match(/\b\d{4}\b/)?.[0];
  if (!code) return;

  pendingOtp = code;
  otpCallbacks.forEach(callback => callback(code));
};

export const startOtpSmsRetriever = async () => {
  if (Platform.OS !== 'android') return;

  pendingOtp = null;
  const {startOtpListener} = require('react-native-otp-verify');
  if (!smsSubscription) smsSubscription = await startOtpListener(handleSms);
};

export const subscribeToOtp = callback => {
  otpCallbacks.add(callback);
  if (pendingOtp) callback(pendingOtp);
  return () => otpCallbacks.delete(callback);
};

export const stopOtpSmsRetriever = async () => {
  if (smsSubscription?.remove) smsSubscription.remove();
  smsSubscription = null;
  pendingOtp = null;
  otpCallbacks.clear();

  if (Platform.OS === 'android') {
    try {
      require('react-native-otp-verify').removeListener();
    } catch (error) {
      // The native listener may already have stopped after receiving an SMS.
    }
  }
};
