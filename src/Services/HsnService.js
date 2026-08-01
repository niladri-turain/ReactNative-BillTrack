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

      console.log('--- getHsnByBusinessCategory Request ---');
      console.log('URL:', uri);

      const response = await axios.get(uri, {headers});

      console.log('--- getHsnByBusinessCategory Response ---');
      if (response.data?.success) {
        const hsns = response.data.data?.hsns || [];
        console.log(`Success: Found ${hsns.length} HSNs for this category`);
        if (hsns.length > 0) {
          console.log('First Item Preview:', hsns[0]);
        }
      } else {
        console.log('Response status:', response.data?.success);
      }

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

      console.log('--- HSN Global Search Request ---');
      console.log('URL:', uri);

      const response = await axios.get(uri);

      console.log('--- HSN Global Search Response ---');
      if (response.data?.status) {
        const results = response.data.data || [];
        console.log(`Success: Found ${results.length} HSNs globally`);
        if (results.length > 0) {
          console.log('First Result Preview:', results[0]);
        }
      }

      return response.data;
    } catch (error) {
      console.error('--- HSN Search Error ---');
      console.error('Response Data:', error.response?.data);
      return error.response?.data;
    }
  }
}

const hsnService = new HsnService();
export {hsnService};
