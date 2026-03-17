import axios from 'axios';

class ThirdPartyApiService {
  async getStateByPincode(pincode) {
    try {
      const uri = `https://api.postalpincode.in/pincode/${pincode}`;
      const response = await axios.get(uri);
      const data = await response?.data;
      return data[0]?.PostOffice[0]?.State;
    } catch (error) {
      const data = await error.response.data;
      return data;
    }
  }
}

const thirdPartyApiService = new ThirdPartyApiService();

export {thirdPartyApiService};
