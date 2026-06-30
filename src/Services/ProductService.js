import axios from 'axios';
import {API_URL} from '../utils/config';
import ToastService from '../Components/Toasts/ToastService';

class ProductService {
  constructor() {
    this.baseUrl = API_URL + 'product';
  }

  async getProductsSuggestions(token) {
    try {
      const uri = `${this.baseUrl}-suggestion`;
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      console.log('--- getProductsSuggestions ---');
      console.log('URL:', uri);
      console.log('Headers:', headers);
      const response = await axios.get(uri, {headers});
      console.log('Response:', response.data);
      console.log('Status Code:', response.status);
      return response.data;
    } catch (error) {
      console.error('--- getProductsSuggestions Error ---');
      console.error('Response Data:', error.response?.data);
      console.error('Status Code:', error.response?.status);
      return error.response?.data;
    }
  }

  // CREATE MULTIPLE PRODUCT
  async createMultipleProduct(token, products) {
    try {
      const uri = `${this.baseUrl}/bulk`;
      const payload = {
        products: products,
      };
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      console.log('--- createMultipleProduct ---');
      console.log('URL:', uri);
      console.log('Headers:', headers);
      console.log('Body:', payload);
      const response = await axios.post(uri, payload, {headers});
      console.log('Response:', response.data);
      console.log('Status Code:', response.status);
      return response.data;
    } catch (error) {
      console.error('--- createMultipleProduct Error ---');
      console.error('Response Data:', error.response?.data);
      console.error('Status Code:', error.response?.status);
      return error.response?.data;
    }
  }

  // CREATE PRODUCT
  async createProduct({
    token,
    name,
    price,
    hsnId = null,
    unit,
    productImage = null,
  }) {
    try {
      const uri = this.baseUrl;
      const formData = new FormData();

      formData.append('name', name);
      if (hsnId) {
        formData.append('hsnId', hsnId);
      }
      formData.append('unitType', unit);
      formData.append('price', price);

      if (productImage) {
        formData.append('logo', productImage);
      }
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      };
      console.log('--- createProduct ---');
      console.log('URL:', uri);
      console.log('Headers:', headers);
      console.log('Body (FormData):', formData);
      const response = await axios.post(uri, formData, {headers});
      console.log('Response:', response.data);
      console.log('Status Code:', response.status);
      return response.data;
    } catch (error) {
      console.error('--- createProduct Error ---');
      console.error('Response Data:', error.response?.data);
      console.error('Status Code:', error.response?.status);
      return error.response?.data;
    }
  }

  // GET ALL PRODUCTS
  async getAllProducts(token) {
    try {
      const uri = `${this.baseUrl}/all`;
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      };
      console.log('--- getAllProducts ---');
      console.log('URL:', uri);
      console.log('Headers:', headers);
      const response = await axios.get(uri, {headers});
      console.log('Response:', response.data);
      console.log('Status Code:', response.status);
      return response.data;
    } catch (error) {
      console.error('--- getAllProducts Error ---');
      console.error('Response Data:', error.response?.data);
      console.error('Status Code:', error.response?.status);
      return error.response?.data;
    }
  }

  // getallactiveinactive
  async getAllActiveInactiveProducts(token) {
    try {
      const uri = `${this.baseUrl}/all-active-inactive`;
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      };
      console.log('--- getAllActiveInactiveProducts ---');
      console.log('URL:', uri);
      console.log('Headers:', headers);
      const response = await axios.get(uri, {headers});
      console.log('Response:', response.data);
      console.log('Status Code:', response.status);
      return response.data;
    } catch (error) {
      console.error('--- getAllActiveInactiveProducts Error ---');
      console.error('Response Data:', error.response?.data);
      console.error('Status Code:', error.response?.status);
      return error.response?.data;
    }
  }

  // UPDATE PRODUCT
  async updateproduct(
    token,
    {name, id, price, unit, productImage = null, hsnId},
  ) {
    try {
      const uri = `${this.baseUrl}/update/product`;
      const formData = new FormData();
      formData.append('id', id);
      formData.append('name', name);
      formData.append('price', price);
      formData.append('unitType', unit);
      if (hsnId) {
        formData.append('hsnId', hsnId);
      }
      if (productImage) {
        formData.append('logo', productImage);
      }
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      };
      console.log('--- updateproduct ---');
      console.log('URL:', uri);
      console.log('Headers:', headers);
      console.log('Body (FormData):', formData);
      const response = await axios.put(uri, formData, {headers});
      console.log('Response:', response.data);
      console.log('Status Code:', response.status);
      return response.data;
    } catch (error) {
      console.error('--- updateproduct Error ---');
      console.error('Response Data:', error.response?.data);
      console.error('Status Code:', error.response?.status);
      return error.response?.data;
    }
  }

  // DEACTIVATE PRODUCT
  async deleteProductById(token, id) {
    try {
      const uri = `${this.baseUrl}/${id}`;
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      console.log('--- deleteProductById ---');
      console.log('URL:', uri);
      console.log('Headers:', headers);
      const response = await axios.delete(uri, {headers});
      console.log('Response:', response.data);
      console.log('Status Code:', response.status);
      return response.data;
    } catch (error) {
      console.error('--- deleteProductById Error ---');
      console.error('Response Data:', error.response?.data);
      console.error('Status Code:', error.response?.status);
      return error.response?.data;
    }
  }

  // update status of products multiple
  async updateProductStatus(products) {
    try {
      const uri = `${this.baseUrl}/update-products-status`;
      const payload = {
        products: products,
      };
      console.log('--- updateProductStatus ---');
      console.log('URL:', uri);
      console.log('Body:', payload);
      const response = await axios.put(uri, payload);
      console.log('Response:', response.data);
      console.log('Status Code:', response.status);
      return response.data;
    } catch (error) {
      console.error('--- updateProductStatus Error ---');
      console.error('Response Data:', error.response?.data);
      console.error('Status Code:', error.response?.status);
      return error.response?.data;
    }
  }
}

const productService = new ProductService();

export {productService};
