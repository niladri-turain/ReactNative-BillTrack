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
      const data = error.response?.data || {status: false, message: error.message};
      return data;
    }
  }

  // Get Sales Report By Date Range
  async getSalesReportByDateRange({token, startDate, endDate, type}) {
    try {
      const url = 'https://test.api.smscannon.in/api/v1/invoice/generate';
      const payload = {
        fromDate: startDate,
        toDate: endDate,
        format: type,
      };
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      console.log('--- getSalesReportByDateRange ---');
      console.log('URL:', url);
      console.log('Headers:', headers);
      console.log('Body:', payload);

      const response = await axios.post(url, payload, {headers});

      console.log('Status Code:', response.status);
      console.log('Response:', response.data);

      const data = response.data;
      return data;
    } catch (error) {
      console.error('--- getSalesReportByDateRange ERROR ---');
      console.error('Status Code:', error.response?.status);
      console.error('Error Data:', error.response?.data);
      const data = error.response?.data || {status: false, message: error.message};
      return data;
    }
  }
}

const salesReportService = new SalesReportService();

export {salesReportService};
