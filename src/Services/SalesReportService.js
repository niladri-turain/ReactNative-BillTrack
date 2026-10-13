import axios from 'axios';
import {API_URL} from '../utils/config';

class SalesReportService {
  constructor() {
    this.baseUrl = API_URL + 'sales-report/';
  }

  // Get Sales Report By Period
  async getSalesReportByPeriod(token, period = 'today') {
    try {
      const uri = `${this.baseUrl}sales?period=${period}`;
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      console.log('--- getSalesReportByPeriod ---');
      console.log('URL:', uri);
      console.log('Headers:', headers);

      const response = await axios.get(uri, {headers});

      console.log('Status Code:', response.status);
      console.log('Response:', response.data);

      const data = response.data;
      return data;
    } catch (error) {
      console.error('--- getSalesReportByPeriod ERROR ---');
      console.error('Status Code:', error.response?.status);
      console.error('Error Data:', error.response?.data);
      const data =
        error.response?.data || {status: false, message: error.message};
      return data;
    }
  }

  // Build the authenticated financial report export URL.
  async exportSalesReport({token, from, to, type}) {
    try {
      const uri = `${this.baseUrl}financial/export/${encodeURIComponent(
        type,
      )}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

      console.log('--- exportSalesReport ---');
      console.log('Params:', {from, to, type});
      console.log('URL:', uri);

      return {
        status: true,
        url: uri,
        token: token,
      };
    } catch (error) {
      console.error('--- exportSalesReport ERROR ---');
      console.error(error);
      return {status: false, message: error.message};
    }
  }
}

const salesReportService = new SalesReportService();

export {salesReportService};
