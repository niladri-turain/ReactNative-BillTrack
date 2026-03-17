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

  // CREATE MULTIPLE PRODUCT
  async createMultipleProduct(token, products) {
    try {
      const uri = `${this.baseUrl}/bulk`;
      const payload = {
        products: products,
      };
      const response = await axios.post(uri, payload, {
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

  // GET ALL PRODUCTS
  async getAllProducts(token) {
    try {
      const uri = `${this.baseUrl}/all`;
      const response = await axios.get(uri, {
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

  // getallactiveinactive
  async getAllActiveInactiveProducts(token) {
    try {
      const uri = `${this.baseUrl}/all-active-inactive`;
      const response = await axios.get(uri, {
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
      formData.append('hsnId', hsnId);
      if (productImage) {
        formData.append('logo', productImage);
      }
      const response = await axios.put(uri, formData, {
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

  // DEACTIVATE PRODUCT
  async deleteProductById(token, id) {
    try {
      const uri = `${this.baseUrl}/${id}`;
      const response = await axios.delete(uri, {
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

  // update status of products multiple
  async updateProductStatus(products) {
    try {
      const uri = `${this.baseUrl}/update-products-status`;
      const payload = {
        products: products,
      };
      const response = await axios.put(uri, payload);
      const data = await response.data;
      return data;
    } catch (error) {
      const data = await error.response.data;
      return data;
    }
  }
}

const productService = new ProductService();

export {productService};
