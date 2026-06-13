import axios from 'axios';
import {API_URL} from '../utils/config';

class InvoiceService {
  constructor() {
    this.baseUrl = API_URL + 'invoice';
  }

  // CREATE - INVOICE
  async createInvoice({
    token,
    customerNumber,
    items = [],
    paymentMode = 'cash',
    discount,
    invoiceNumber,
  }) {
    try {
      const uri = this.baseUrl;
      const payload = {
        status: 'paid',
        customerNumber: customerNumber,
        items: items,
        paymentMode: paymentMode,
        discount,
        invoiceNumber,
      };
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      console.log('--- createInvoice ---');
      console.log('URL:', uri);
      console.log('Headers:', headers);
      console.log('Body:', payload);
      const response = await axios.post(uri, payload, {headers});
      console.log('Response:', response.data);
      console.log('Status Code:', response.status);
      return response.data;
    } catch (error) {
      console.error('--- createInvoice Error ---');
      console.error('Response Data:', error.response?.data);
      console.error('Status Code:', error.response?.status);
      return error.response?.data;
    }
  }

  // GET - CANCEL INVOICES
  async getCancelInvoices(token, page = 0, limit = 10, sortBy = 'date_desc') {
    try {
      const uri = `${this.baseUrl}/canceled/list?page=${page}&limit=${limit}&sortBy=${sortBy}`;
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      console.log('--- getCancelInvoices ---');
      console.log('URL:', uri);
      console.log('Headers:', headers);
      const response = await axios.get(uri, {headers});
      console.log('Response:', response.data);
      console.log('Status Code:', response.status);
      return response.data;
    } catch (error) {
      console.error('--- getCancelInvoices Error ---');
      console.error('Response Data:', error.response?.data);
      console.error('Status Code:', error.response?.status);
      return error.response?.data;
    }
  }

  // GET - INVOICE
  async getInvoices(token, page = 0, limit = 10, sortBy = 'date_desc') {
    try {
      const uri = `${this.baseUrl}?page=${page}&limit=${limit}&sortBy=${sortBy}`;
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      console.log('--- getInvoices ---');
      console.log('URL:', uri);
      console.log('Headers:', headers);
      const response = await axios.get(uri, {headers});
      console.log('Response:', response.data);
      console.log('Status Code:', response.status);
      return response.data;
    } catch (error) {
      console.error('--- getInvoices Error ---');
      console.error('Response Data:', error.response?.data);
      console.error('Status Code:', error.response?.status);
      return error.response?.data;
    }
  }

  // GET - INVOICE ITEMS
  async getInvoiceItems(invoiceId) {
    try {
      const uri = `${this.baseUrl}/items/${invoiceId}`;
      console.log('--- getInvoiceItems ---');
      console.log('URL:', uri);
      const response = await axios.get(uri);
      console.log('Response:', response.data);
      console.log('Status Code:', response.status);
      return response.data;
    } catch (error) {
      console.error('--- getInvoiceItems Error ---');
      console.error('Response Data:', error.response?.data);
      console.error('Status Code:', error.response?.status);
      return error.response?.data;
    }
  }

  // GET - INVOICE COUNT
  async getInvoiceCount(token, businessId) {
    try {
      const uri = `${this.baseUrl}/count/${businessId}`;
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      console.log('--- getInvoiceCount ---');
      console.log('URL:', uri);
      console.log('Headers:', headers);
      const response = await axios.get(uri, {headers});
      console.log('Response:', response.data);
      console.log('Status Code:', response.status);
      return response.data;
    } catch (error) {
      console.error('--- getInvoiceCount Error ---');
      console.error('Response Data:', error.response?.data);
      console.error('Status Code:', error.response?.status);
      return error.response?.data;
    }
  }

  // CANCEL INVOICE
  async cancelInvoiceById(token, invoiceId) {
    try {
      const uri = `${this.baseUrl}/cancel/${invoiceId}`;
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      console.log('--- cancelInvoiceById ---');
      console.log('URL:', uri);
      console.log('Headers:', headers);
      console.log('Body:', {});
      const response = await axios.put(uri, {}, {headers});
      console.log('Response:', response.data);
      console.log('Status Code:', response.status);
      return response.data;
    } catch (error) {
      console.error('--- cancelInvoiceById Error ---');
      console.error('Response Data:', error.response?.data);
      console.error('Status Code:', error.response?.status);
      return error.response?.data;
    }
  }
}

const invoiceService = new InvoiceService();

export {invoiceService};
