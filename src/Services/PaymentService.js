import axios from 'axios';
import {API_URL} from '../utils/config';

class PaymentService {
  constructor() {
    this.baseUrl = API_URL + 'payment/';
  }

  async createOrder(amount) {
    const uri = this.baseUrl + 'create-order';
    try {
      const payload = {
        amount: amount,
      };
      const response = await axios.post(uri, payload);
      console.log(`[PaymentService] POST ${uri} - Status: ${response.status}`);
      return response.data;
    } catch (error) {
      console.log(`[PaymentService] POST ${uri} - Error Status: ${error.response?.status}`);
      const data = error.response?.data;
      return data;
    }
  }
}

const paymentService = new PaymentService();

export {paymentService};
