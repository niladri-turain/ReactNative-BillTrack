import axios from 'axios';
import {API_URL} from '../utils/config';

class BusinessCategoryService {
  constructor() {
    this.baseUrl = API_URL + 'businessCategory/';
  }

  async getAllBusinessCategory() {
    try {
      const uri = this.baseUrl;
      const response = await axios.get(uri);
      const data = await response.data?.data;
      return data;
    } catch (error) {
      const data = await error.response.data;
      return data;
    }
  }
}

const businessCategoryService = new BusinessCategoryService();

export {businessCategoryService};
