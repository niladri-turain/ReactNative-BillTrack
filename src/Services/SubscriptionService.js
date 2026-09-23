import axios from 'axios';
import {API_URL} from '../utils/config';

// RFC4122 v4 UUID, used as a fresh idempotency key on every order-create call
const generateIdempotencyKey = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r % 4) + 8;
    return v.toString(16);
  });
};

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

  async activateSubscription({
    token,
    planId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  }) {
    const uri = API_URL + 'payment/activate-subscription';
    const payload = {
      planId: String(planId),
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      paymentSignature: razorpaySignature,
    };
    try {
      const headers = token ? {Authorization: `Bearer ${token}`} : undefined;
      console.log(`[SubscriptionService] POST ${uri}`);
      console.log('[SubscriptionService] Body:', payload);
      const response = await axios.post(uri, payload, {headers});
      console.log(`[SubscriptionService] POST ${uri} - Status: ${response.status}`);
      console.log(`[SubscriptionService] POST ${uri} - Response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[SubscriptionService] POST ${uri} - Error`);
      console.error('[SubscriptionService] URL:', uri);
      console.error('[SubscriptionService] Body:', payload);
      console.error('[SubscriptionService] Error Status:', error.response?.status);
      console.error('[SubscriptionService] Error Response:', error.response?.data);
      console.error('[SubscriptionService] Error Message:', error.message);
      return error.response?.data;
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

  async createSubscriptionOrder({token, planId}) {
    const uri = API_URL + 'payment/create-order';
    const payload = {
      planId: String(planId),
      idempotencyKey: generateIdempotencyKey(),
    };
    try {
      const headers = token ? {Authorization: `Bearer ${token}`} : undefined;
      console.log(`[SubscriptionService] POST ${uri}`);
      console.log('[SubscriptionService] Body:', payload);
      const response = await axios.post(uri, payload, {headers});
      console.log(`[SubscriptionService] POST ${uri} - Status: ${response.status}`);
      console.log(`[SubscriptionService] POST ${uri} - Response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[SubscriptionService] POST ${uri} - Error`);
      console.error('[SubscriptionService] URL:', uri);
      console.error('[SubscriptionService] Body:', payload);
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
