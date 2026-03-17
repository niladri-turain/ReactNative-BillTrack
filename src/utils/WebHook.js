import axios from 'axios';
import {API_URL} from './config';
import {getDeviceDetails} from './DeviceInfo';

class WebHook {
  constructor() {
    this.baseUrl = API_URL + 'webhook/';
  }

  async verifyDevice() {
    try {
      const {deviceUniqueKey} = await getDeviceDetails();
      const uri = `${this.baseUrl}device-check`;
      const payload = {
        uniqueKey: deviceUniqueKey,
      };
      const response = await axios.post(uri,payload);
      return response.data;
    } catch (error) {
      return false;
    }
  }
}

const webHook = new WebHook();

export default webHook;
