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
      const response = await axios.get(uri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('--- getSalesReportByPeriod ---');
      console.log('URL:', uri);
      console.log('Status:', response.status);
      console.log('Response:', response.data);

      const data = response.data;
      return data;
    } catch (error) {
      console.log('--- getSalesReportByPeriod ERROR ---');
      console.log('Status:', error.response?.status);
      console.log('Error Data:', error.response?.data);
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
      console.log('--- getSalesReportByDateRange ---');
      console.log('URL:', url);
      console.log('Body:', payload);

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Status:', response.status);
      console.log('Response:', response.data);

      const data = response.data;
      return data;
    } catch (error) {
      console.log('--- getSalesReportByDateRange ERROR ---');
      console.log('Status:', error.response?.status);
      console.log('Error Data:', error.response?.data);
      const data = error.response?.data || {status: false, message: error.message};
      return data;
    }
  }
}

const salesReportService = new SalesReportService();

export {salesReportService};
