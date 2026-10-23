import axios from 'axios';
import {API_URL} from '../utils/config';
import {StateModel} from '../Models/StateModel';

class StateService {
  constructor() {
    this.baseUrl = API_URL + 'state';
  }

  async getStates(token) {
    console.log('--- getStates Request ---');
    console.log('URL:', this.baseUrl);
    try {
      const response = await axios.get(this.baseUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('--- getStates Response ---');
      console.log('Status Code:', response.status);
      console.log('Response Data:', response.data);
      return {
        ...response.data,
        data: (response.data?.data || []).map(StateModel.fromJson),
      };
    } catch (error) {
      console.error('--- getStates Error ---');
      console.error('URL:', this.baseUrl);
      console.error('Status Code:', error.response?.status);
      console.error('Response Data:', error.response?.data);
      console.error('Error Message:', error.message);
      return error.response?.data;
    }
  }
}

const stateService = new StateService();

export {stateService};
