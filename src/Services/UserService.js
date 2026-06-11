import axios from 'axios';
import {API_URL} from '../utils/config';

class UserService {
  constructor() {
    this.baseUrl = API_URL + 'user/';
  }

  async updateUser({name, email='', token}) {
    try {
      const uri = `${this.baseUrl}update-profile`;
      const payload = {
        name: name,
        email: email,
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
}

const userService = new UserService();

export {userService};
