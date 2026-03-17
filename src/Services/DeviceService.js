import axios from 'axios';
import {API_URL} from '../utils/config';

class DeviceService {
  constructor() {
    this.baseUrl = API_URL;
  }

  async removeDevice({deviceUniqueKey}) {
    const uri = `${this.baseUrl}device/remove-device/${deviceUniqueKey}`;
    try {
      const response = await axios.delete(uri);
      const data = await response.data;
      return data;
    } catch (error) {
      const data = await error.response.data;
      return data;
    }
  }
}

const deviceService = new DeviceService();

export {deviceService};
