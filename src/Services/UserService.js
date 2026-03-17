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

      const response = await axios.put(uri, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.data;
      return data;
    } catch (error) {
      const data = await error.response.data;
      return data;
    }
  }
}

const userService = new UserService();

export {userService};
