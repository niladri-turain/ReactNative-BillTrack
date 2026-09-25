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
    const longUrl = `https://dev.billtrack.co.in/invoice-details/${invoiceNumber}9876543210/${businessId}1234567890`;
    let invoiceUrl = longUrl;

    try {
      const shortRes = await fetch('https://sttn.in/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vyc19pZCI6NzIsIm1vYmlsZSI6IjcwNTkyMzgwNzIiLCJpYXQiOjE3ODg1OTA0MTYsImV4cCI6MTgyMDE0ODAxNn0.qgl2gK_LZnil3pwUcGWpwofxMNGBUZic1cdnmabU0ws'
        },
        body: JSON.stringify({
          originalUrl: longUrl,
          type: 'static'
        })
      });
      const shortData = await shortRes.json();
      console.log('[SmsService] Shorten response:', shortData);
      if (shortData.shortUrl) {
        invoiceUrl = shortData.shortUrl.replace('/api/shorten', '');
      }
    } catch (e) {
      console.log('[SmsService] Shorten failed', e);
    }

    const payload = {
      phone,
      invoiceNumber,
      totalAmount,
      businessName,
      businessId,
      invoiceUrl
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
