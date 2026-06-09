import axios from 'axios';
import {API_URL} from '../utils/config';

class BusinessCategoryService {
  constructor() {
    this.baseUrl = API_URL + 'businessCategory/';
  }

  async getAllBusinessCategory() {
    try {
      const uri = this.baseUrl;
      console.log('--- getAllBusinessCategory ---');
      console.log('URL:', uri);
      const response = await axios.get(uri);
      console.log('Response:', response.data);
      console.log('Status Code:', response.status);
      return response.data?.data;
    } catch (error) {
      console.error('--- getAllBusinessCategory Error ---');
      console.error('Response Data:', error.response?.data);
      console.error('Status Code:', error.response?.status);
      return error.response?.data;
    }
  }
}

const businessCategoryService = new BusinessCategoryService();

export {businessCategoryService};
