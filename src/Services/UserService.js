import axios from 'axios';
import {API_URL} from '../utils/config';

class UserService {
  constructor() {
    this.baseUrl = API_URL + 'user/';
    
  }

  async updateUser({name, email='', phone, token}) {
    try {
      const uri = `${this.baseUrl}update-profile`;
      const payload = {
        name: name,
        email: email,
        phone: phone,
      };
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      console.log('--- updateUser ---');
      console.log('URL:', uri);
      console.log('Headers:', headers);
      console.log('Body:', payload);

      const response = await axios.put(uri, payload, {headers});

      console.log('Response:', response.data);
      console.log('Status Code:', response.status);

      const data = await response.data;
      return data;
    } catch (error) {
      console.error('--- updateUser Error ---');
      console.error('Response Data:', error.response?.data);
      console.error('Status Code:', error.response?.status);
      const data = await error.response.data;
      return data;
    }
  }

  async deleteAccount({token, reason}) {
    const uri = `${this.baseUrl}account/delete`;
    const payload = {confirm: true};
    if (reason) payload.reason = reason;
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    console.log('--- deleteAccount ---');
    console.log('Method:', 'POST');
    console.log('URL:', uri);
    console.log('Headers:', {Authorization: 'Bearer [REDACTED]'});
    console.log('Body:', payload);

    try {
      const response = await axios.post(uri, payload, {headers});
      console.log('Response:', response.data);
      console.log('Status Code:', response.status);
      if (response.status === 200 && response.data?.status === true) {
        return response.data;
      }
      return {
        ...response.data,
        status: false,
        message: response.data?.message || 'Account deletion was not confirmed',
      };
    } catch (error) {
      console.error('--- deleteAccount Error ---');
      console.error('Response Data:', error.response?.data);
      console.error('Status Code:', error.response?.status);
      console.error('Error Message:', error.message);
      return error.response?.data || {
        status: false,
        message: error.message || 'Unable to delete account',
      };
    }
  }

  async updateUserProfileImage({profileImage, token}) {
    try {
      const uri = `${API_URL}business/update-logo`;
      const formData = new FormData();
      formData.append('logo', profileImage);

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      };

      console.log('--- updateUserProfileImage ---');
      console.log('URL:', uri);
      console.log('Headers:', headers);
      console.log('Body (FormData):', formData);

      const response = await axios.put(uri, formData, {headers});

      console.log('Response:', response.data);
      console.log('Status Code:', response.status);

      return response.data;
    } catch (error) {
      console.error('--- updateUserProfileImage Error ---');
      console.error('Response Data:', error.response?.data);
      console.error('Status Code:', error.response?.status);
      return error.response?.data;
    }
  }
}

const userService = new UserService();

export {userService};
