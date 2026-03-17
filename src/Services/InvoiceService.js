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
      const response = await axios.post(uri, payload, {
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

  // GET - INVOICE
  async getInvoices(token, page = 0, limit = 10, sortBy = 'date_desc') {
    try {
      const uri = `${this.baseUrl}?page=${page}&limit=${limit}&sortBy=${sortBy}`;
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

  // GET - INVOICE ITEMS
  async getInvoiceItems(invoiceId) {
    try {
      const uri = `${this.baseUrl}/items/${invoiceId}`;
      const response = await axios.get(uri);
      const data = await response.data;
      return data;
    } catch (error) {
      const data = await error.response.data;
      return data;
    }
  }

  // GET - INVOICE COUNT
  async getInvoiceCount(token, businessId) {
    try {
      const uri = `${this.baseUrl}/count/${businessId}`;
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
}

const invoiceService = new InvoiceService();

export {invoiceService};
