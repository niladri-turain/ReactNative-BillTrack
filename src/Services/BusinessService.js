import axios from 'axios';
import {API_URL} from '../utils/config';

class BusinessService {
  constructor() {
    this.baseUrl = API_URL + 'business';
  }

  async createBusiness({
    name,
    gstNumber = null,
    street,
    city,
    state,
    pincode,
    email,
    phone,
    businessCategoryId,
    logo,
    token,
    deviceInfo,
  }) {
    try {
      const uri = this.baseUrl;
      const formData = new FormData();
      formData.append('name', name);
      if (gstNumber) {
        formData.append('gstNumber', gstNumber);
      }
      formData.append('street', street);
      formData.append('city', city);
      formData.append('state', state);
      formData.append('pincode', pincode);
      if (email) {
        formData.append('email', email);
      }
      if (phone) {
        formData.append('phone', phone);
      }

      formData.append('businessCategoryId', businessCategoryId);
      formData.append('logo', logo);
      formData.append('fcmToken', deviceInfo.fcmToken);
      formData.append('deviceType', deviceInfo.deviceType);
      formData.append('deviceModel', deviceInfo.deviceModel);
      formData.append('deviceName', deviceInfo.deviceName);
      formData.append('deviceUniqueKey', deviceInfo.deviceUniqueKey);

      const response = await axios.post(uri, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.data;
      return data;
    } catch (error) {
      const data = await error.response.data;
      return data;
    }
  }

  async getBusiness(token) {
    try {
      const uri = this.baseUrl;
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

  async updateBusiness({
    token,
    gstNumber,
    street,
    city,
    state,
    pinCode,
    email,
    phone,
    prefix,
  }) {
    const uri = this.baseUrl + '/update';
    const payload = {};
    if (gstNumber) {
      payload.gstNumber = gstNumber;
    }
    if (street) {
      payload.street = street;
    }
    if (city) {
      payload.city = city;
    }
    if (state) {
      payload.state = state;
    }
    if (pinCode) {
      payload.pinCode = pinCode;
    }
    if (email) {
      payload.email = email;
    }
    if (phone) {
      payload.phone = phone;
    }
    if (prefix) {
      payload.prefix = prefix;
    }
    try {
      const response = await axios.put(uri, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
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

const businessService = new BusinessService();

export {businessService};
