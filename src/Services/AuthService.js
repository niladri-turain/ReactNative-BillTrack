import {API_URL} from '../utils/config';
import axios from 'axios';

class AuthService {
  constructor() {
    this.baseUrl = API_URL + 'auth/';
  }

  // SENT OTP
  async login(mobile) {
    try {
      const uri = this.baseUrl + 'login';
      const payload = {
        phone: mobile,
      };
      const response = await axios.post(uri, payload);
      const data = await response.data;
      return data;
    } catch (error) {
      const data = await error.response.data;
      return data;
    }
  }

  // VALIDATE OTP
  async validateOtp(mobile, otp, deviceInfo = {}) {
    try {
      const uri = this.baseUrl + 'verify';
      const payload = {
        phone: mobile,
        otp: otp,
        ...deviceInfo,
      };
      const response = await axios.post(uri, payload);
      const data = await response.data;
      return data;
    } catch (error) {
      const data = await error.response.data;
      return data;
    }
  }

  async removeDeviceAndRelogin({
    fcmToken,
    deviceType,
    deviceModel,
    deviceName,
    deviceUniqueKey,
    phone,
  }) {
    try {
      const uri = this.baseUrl + 'remove-device-login';
      const payload = {
        fcmToken,
        deviceType,
        deviceModel,
        deviceName,
        deviceUniqueKey,
        phone,
      };
      const response = await axios.post(uri, payload);
      const data = await response.data;
      return data;
    } catch (error) {
      const data = await error.response.data;
      return data;
    }
  }
}

const authService = new AuthService();

export {authService};
