import axios from 'axios';
import {API_URL} from '../utils/config';
import {
  BusinessUpiModel,
  mapBusinessUpiList,
} from '../Models/BusinessUpiModel';

class BusinessUpiService {
  constructor() {
    this.baseUrl = API_URL + 'business/upi';
  }

  async getUpiIds(token) {
    const headers = {Authorization: `Bearer ${token}`};
    console.log('[BusinessUpiService] GET URL:', this.baseUrl);
    console.log('[BusinessUpiService] GET headers:', {
      Authorization: token ? 'Bearer [token present]' : 'Bearer [missing]',
    });

    try {
      const response = await axios.get(this.baseUrl, {headers});
      console.log('[BusinessUpiService] GET status:', response.status);
      console.log('[BusinessUpiService] GET response:', response.data);
      return {
        ...response.data,
        data: mapBusinessUpiList(response.data?.data),
      };
    } catch (error) {
      console.error('[BusinessUpiService] GET error URL:', this.baseUrl);
      console.error('[BusinessUpiService] GET error status:', error.response?.status);
      console.error('[BusinessUpiService] GET error response:', error.response?.data);
      console.error('[BusinessUpiService] GET error message:', error.message);
      return error.response?.data || {status: false, message: error.message};
    }
  }

  async addUpiId({token, upiId, label}) {
    const headers = {Authorization: `Bearer ${token}`};
    const payload = {upiId, isDefault: false};
    if (label?.trim()) {
      payload.label = label.trim();
    }
    console.log('[BusinessUpiService] POST URL:', this.baseUrl);
    console.log('[BusinessUpiService] POST headers:', {
      Authorization: token ? 'Bearer [token present]' : 'Bearer [missing]',
    });
    console.log('[BusinessUpiService] POST body:', payload);

    try {
      const response = await axios.post(this.baseUrl, payload, {headers});
      console.log('[BusinessUpiService] POST status:', response.status);
      console.log('[BusinessUpiService] POST response:', response.data);
      return {
        ...response.data,
        data: response.data?.data
          ? BusinessUpiModel.fromJson(response.data.data)
          : response.data?.data,
      };
    } catch (error) {
      console.error('[BusinessUpiService] POST error URL:', this.baseUrl);
      console.error('[BusinessUpiService] POST error status:', error.response?.status);
      console.error('[BusinessUpiService] POST error response:', error.response?.data);
      console.error('[BusinessUpiService] POST error message:', error.message);
      return error.response?.data || {status: false, message: error.message};
    }
  }

  async deleteUpiId(token, id) {
    const uri = `${this.baseUrl}/${id}`;
    const headers = {Authorization: `Bearer ${token}`};
    console.log('[BusinessUpiService] DELETE URL:', uri);
    console.log('[BusinessUpiService] DELETE headers:', {
      Authorization: token ? 'Bearer [token present]' : 'Bearer [missing]',
    });

    try {
      const response = await axios.delete(uri, {headers});
      console.log('[BusinessUpiService] DELETE status:', response.status);
      console.log('[BusinessUpiService] DELETE response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[BusinessUpiService] DELETE error URL:', uri);
      console.error('[BusinessUpiService] DELETE error status:', error.response?.status);
      console.error('[BusinessUpiService] DELETE error response:', error.response?.data);
      console.error('[BusinessUpiService] DELETE error message:', error.message);
      return error.response?.data || {status: false, message: error.message};
    }
  }
}

const businessUpiService = new BusinessUpiService();

export {businessUpiService};
