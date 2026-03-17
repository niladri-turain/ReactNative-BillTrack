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
      const data = await response.data;
      return data;
    } catch (error) {
      const data = await error.response.data;
      return data;
    }
  }

  // Get Sales Report By Date Range
  async getSalesReportByDateRange({token, startDate, endDate, type}) {
    try {
      const payload = {
        fromDate: startDate,
        toDate: endDate,
        format: type,
      };
      const response = await axios.post('https://test.api.smscannon.in/api/v1/invoice/generate', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.data;
      return data;
    } catch (error) {
      const data = await error.response.data;
      return data;
    }
  }
}

const salesReportService = new SalesReportService();

export {salesReportService};
