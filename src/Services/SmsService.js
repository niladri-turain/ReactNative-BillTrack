import axios from 'axios';
import {API_URL} from './../utils/config';
class SmsService {
  constructor() {
    this.baseUrl = API_URL + 'sms';
  }

  async sendInvoiceSms({
    token,
    phone,
    invoiceNumber,
    totalAmount,
    businessName,
    businessId
  }) {
    try {
      const uri = `${this.baseUrl}/sent-invoice`;
      const payload = {
        phone,
        invoiceNumber,
        totalAmount,
        businessName,
        businessId
      };
      const response = await axios.post(uri, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.data;
      return data;
    } catch (error) {
      const data = await error.response.data;
      throw data;
    }
  }
}

const smsService = new SmsService();

export {smsService};
