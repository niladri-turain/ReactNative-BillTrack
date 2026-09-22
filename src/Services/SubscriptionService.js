import axios from 'axios';
import {API_URL} from '../utils/config';

class SubscriptionService {
  constructor() {
    this.baseUrl = API_URL + 'subscription';
  }

  async currentSubscription(token) {
    const uri = this.baseUrl + '/current-subscription';
    try {
      const response = await axios.get(uri, {
        headers: {Authorization: `Bearer ${token}`},
      });
      console.log(`[SubscriptionService] GET ${uri} - Status: ${response.status}`);
      return response.data;
    } catch (error) {
      console.log(`[SubscriptionService] GET ${uri} - Error Status: ${error.response?.status}`);
      const data = error.response?.data;
      return data;
    }
  }

  async purchaseSubscription({
    token,
    plan,
    orderId,
    paymentId,
    paymentSignature,
    amount,
  }) {
    const uri = this.baseUrl;
    try {
      const payload = {
        plan: plan,
        orderId: orderId,
        paymentId: paymentId,
        paymentSignature: paymentSignature,
        amount: amount,
      };
      const response = await axios.post(uri, payload, {
        headers: {Authorization: `Bearer ${token}`},
      });
      console.log(`[SubscriptionService] POST ${uri} - Status: ${response.status}`);
      return response.data;
    } catch (error) {
      console.log(`[SubscriptionService] POST ${uri} - Error Status: ${error.response?.status}`);
      const data = error.response?.data;
      return data;
    }
  }

  async getActivePlans(token) {
    const uri = API_URL + 'subscription-plan/active';
    try {
      const headers = token ? {Authorization: `Bearer ${token}`} : undefined;
      console.log(`[SubscriptionService] GET ${uri}`);
      const response = await axios.get(uri, {headers});
      console.log(`[SubscriptionService] GET ${uri} - Status: ${response.status}`);
      console.log(`[SubscriptionService] GET ${uri} - Response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[SubscriptionService] GET ${uri} - Error`);
      console.error('[SubscriptionService] URL:', uri);
      console.error('[SubscriptionService] Error Status:', error.response?.status);
      console.error('[SubscriptionService] Error Response:', error.response?.data);
      console.error('[SubscriptionService] Error Message:', error.message);
      return error.response?.data;
    }
  }

  async allSubscriptions(token) {
    const uri = this.baseUrl + '/subscription';
    try {
      const response = await axios.get(uri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(`[SubscriptionService] GET ${uri} - Status: ${response.status}`);
      return response.data;
    } catch (error) {
      console.log(`[SubscriptionService] GET ${uri} - Error Status: ${error.response?.status}`);
      const data = error.response?.data;
      return data;
    }
  }
}

const subscriptionService = new SubscriptionService();

export {subscriptionService};
