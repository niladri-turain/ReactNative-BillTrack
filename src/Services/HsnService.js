import axios from 'axios';
import {API_URL} from '../utils/config';

class HsnService {
  constructor() {
    this.baseUrl = API_URL + 'hsn/';
  }

  async search(query) {
    try {
      const uri = `${this.baseUrl}search?query=${query}`;
      const response = await axios.get(uri);
      const data = await response.data;
      return data;
    } catch (error) {
      const data = await error.response.data;
      return data;
    }
  }
}

const hsnService = new HsnService();
export {hsnService};
