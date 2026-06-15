import axios from 'axios';
import {API_URL} from '../utils/config';

class UnitService {
  constructor() {
    this.baseUrl = API_URL + 'unit/business-category';
  }

  async getUnitsByBusinessCategory(token, businessCategoryId) {
    try {
      const uri = `${this.baseUrl}/${businessCategoryId}`;
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      console.log('--- getUnitsByBusinessCategory ---');
      console.log('URL:', uri);
      console.log('Headers:', headers);

      const response = await axios.get(uri, {headers});

      console.log('Response:', response.data);
      console.log('Status Code:', response.status);

      return response.data;
    } catch (error) {
      console.error('--- getUnitsByBusinessCategory Error ---');
      console.error('Response Data:', error.response?.data);
      console.error('Status Code:', error.response?.status);
      return error.response?.data;
    }
  }
}

const unitService = new UnitService();

export {unitService};