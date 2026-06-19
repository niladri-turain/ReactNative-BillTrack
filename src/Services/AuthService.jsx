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
      
      console.log('--- AuthService: login ---');
      console.log('URL:', uri);
      console.log('Payload/Body:', payload);
      
      const response = await axios.post(uri, payload);
      
      console.log('Status Code:', response.status);
      
      const data = await response.data;
      console.log('Response Data:', data);
      
      return data;
    } catch (error) {
      console.log('Error in login:');
      console.log('Error Status Code:', error.response?.status);
      console.log('Error Response Data:', error.response?.data);
      const data = await error.response?.data;
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
      
      console.log('--- AuthService: validateOtp ---');
      console.log('URL:', uri);
      console.log('Payload/Body:', payload);
      
      const response = await axios.post(uri, payload);
      
      console.log('Status Code:', response.status);
      
      const data = await response.data;
      console.log('Response Data:', data);
      
      return data;
    } catch (error) {
      console.log('Error in validateOtp:');
      console.log('Error Status Code:', error.response?.status);
      console.log('Error Response Data:', error.response?.data);
      const data = await error.response?.data;
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
      
      console.log('--- AuthService: removeDeviceAndRelogin ---');
      console.log('URL:', uri);
      console.log('Payload/Body:', payload);
      
      const response = await axios.post(uri, payload);
      
      console.log('Status Code:', response.status);
      
      const data = await response.data;
      console.log('Response Data:', data);
      
      return data;
    } catch (error) {
      console.log('Error in removeDeviceAndRelogin:');
      console.log('Error Status Code:', error.response?.status);
      console.log('Error Response Data:', error.response?.data);
      const data = await error.response?.data;
      return data;
    }
  }

  // CHANGE PHONE
  async changePhone(userId, newPhone) {
    try {
      const uri = this.baseUrl + 'change-phone';
      const payload = {
        userId: userId,
        newPhone: newPhone,
      };

      console.log('--- AuthService: changePhone ---');
      console.log('URL:', uri);
      console.log('Payload/Body:', payload);

      const response = await axios.post(uri, payload);

      console.log('Status Code:', response.status);

      const data = await response.data;
      console.log('Response Data:', data);

      return data;
    } catch (error) {
      console.log('Error in changePhone:');
      console.log('Error Status Code:', error.response?.status);
      console.log('Error Response Data:', error.response?.data);
      const data = await error.response?.data;
      return data;
    }
  }

  // VERIFY CHANGE PHONE
  async verifyPhone(userId, otp) {
    try {
      const uri = this.baseUrl + 'verify-change-phone';
      const payload = {
        userId: userId,
        otp: otp,
      };

      console.log('--- AuthService: verifyChangePhone ---');
      console.log('URL:', uri);
      console.log('Payload/Body:', payload);

      const response = await axios.post(uri, payload);

      console.log('Status Code:', response.status);

      const data = await response.data;
      console.log('Response Data:', data);

      return data;
    } catch (error) {
      console.log('Error in verifyChangePhone:');
      console.log('Error Status Code:', error.response?.status);
      console.log('Error Response Data:', error.response?.data);
      const data = await error.response?.data;
      return data;
    }
  }
}

const authService = new AuthService();

export {authService};
