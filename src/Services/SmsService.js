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
    const uri = `${this.baseUrl}/sent-invoice`;
    const payload = {
      phone,
      invoiceNumber,
      totalAmount,
      businessName,
      businessId
    };
    try {
      console.log(`[SmsService] POST ${uri}`);
      console.log('[SmsService] Body:', payload);
      const response = await axios.post(uri, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(`[SmsService] POST ${uri} - Status: ${response.status}`);
      console.log(`[SmsService] POST ${uri} - Response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[SmsService] POST ${uri} - Error`);
      console.error('[SmsService] URL:', uri);
      console.error('[SmsService] Body:', payload);
      console.error('[SmsService] Error Status:', error.response?.status);
      console.error('[SmsService] Error Response:', error.response?.data);
      console.error('[SmsService] Error Message:', error.message);
      throw error.response?.data;
    }
  }
}

const smsService = new SmsService();

export {smsService};
