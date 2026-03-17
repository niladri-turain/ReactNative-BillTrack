import axios from 'axios';
import {API_URL} from '../utils/config';

class PaymentService {
  constructor() {
    this.baseUrl = API_URL + 'payment/';
  }

  async createOrder(amount) {
    try {
      const uri = this.baseUrl + 'create-order';
      const payload = {
        amount: amount,
      };
      const response = await axios.post(uri, payload);
      const data = await response.data;
      return data;
    } catch (error) {
      const response = error.response;
      const data = await response.data;
      return data;
    }
  }
}

const paymentService = new PaymentService();

export {paymentService};
