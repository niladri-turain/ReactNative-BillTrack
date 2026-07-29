import axios from 'axios';
import {API_URL} from '../utils/config';

class HsnService {
  constructor() {
    this.baseUrl = API_URL + 'business-category-hsn/admin/business-category';
  }

  async getHsnByBusinessCategory(token, businessCategoryId) {
    try {
      const uri = `${this.baseUrl}/${businessCategoryId}`;
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      console.log('--- getHsnByBusinessCategory ---');
      console.log('URL:', uri);
      console.log('Headers:', headers);

      const response = await axios.get(uri, {headers});

      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('--- getHsnByBusinessCategory Error ---');
      console.error('Response Data:', error.response?.data);
      return error.response?.data;
    }
  }

  async search(query) {
    try {
      const uri = `${API_URL}hsn/search?query=${query}`;
      const response = await axios.get(uri);
      return response.data;
    } catch (error) {
      return error.response?.data;
    }
  }
}

const hsnService = new HsnService();
export {hsnService};
