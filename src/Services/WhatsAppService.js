import axios from 'axios';

class WhatsAppService {
  constructor() {
    this.baseUrl = 'http://192.168.0.160:3000/';
  }

  async createSession(phone) {
    try {
      const payload = {
        phone: phone,
      };
      console.log('Creating WhatsApp session (pairing):', payload);
      const response = await axios.post(`${this.baseUrl}api/pair`, payload);
      console.log('WhatsApp session response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in createSession:', error.response?.data || error.message);
      if (error.response) {
        return error.response.data;
      }
      return {success: false, message: error.message};
    }
  }

  async sendMessage(recipient, message) {
    try {
      const payload = {
        recipient: recipient,
        message: message,
      };
      console.log('Sending WhatsApp message via API:', payload);
      const response = await axios.post(`${this.baseUrl}api/send`, payload);
      console.log('WhatsApp message response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in sendMessage:', error.response?.data || error.message);
      if (error.response) {
        return error.response.data;
      }
      return {success: false, message: error.message};
    }
  }

  async checkStatus() {
    try {
      console.log('Checking WhatsApp connection status...');
      const response = await axios.get(`${this.baseUrl}api/status`);
      console.log('WhatsApp status response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in checkStatus:', error.response?.data || error.message);
      if (error.response) {
        return error.response.data;
      }
      return {status: 'error', message: error.message};
    }
  }
}

const whatsAppService = new WhatsAppService();
export {whatsAppService};
