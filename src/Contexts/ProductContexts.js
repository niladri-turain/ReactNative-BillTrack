import {createContext, useState, useEffect, useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuthToken} from './AuthContext';
import {productService} from '../Services/ProductService';

const ProductContext = createContext();

const STORAGE_KEY = 'PRODUCTS';

const ProductProvider = ({children}) => {
  const token = useAuthToken();
  const [Products, setProducts] = useState([]);

  const fetchApiToGetData = async () => {
    try {
      const data = await productService.getAllProducts(token);
      if (data?.status) {
        await resetProducts(data?.data || []);
      }
    } catch (error) {}
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data && !data.includes('[]')) {
          setProducts(JSON.parse(data));
        } else {
          await fetchApiToGetData();
        }
      } catch (error) {}
    };

    loadProducts();
  }, [token]);

  useEffect(() => {
    const saveProducts = async () => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Products));
    };
    saveProducts();
  }, [Products]);

  const addProduct = product => {
    setProducts(prev => {
      const exists = prev.find(p => p.id === product.id);

      if (exists) {
        return prev.map(p => (p.id === product.id ? product : p));
      } else {
        return [...prev, product];
      }
    });
  };

  const removeProduct = id => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  const resetProducts = (productList = []) => {
    setProducts(productList);
  };

  const resetProductCount = () => {
    setProducts(prev => prev.map(p => ({...p, count: 0})));
  };

  const clearAllProducts = async () => {
    setProducts([]);
  };

  return (
    <ProductContext.Provider
      value={{
        Products,
        addProduct,
        removeProduct,
        resetProducts,
        clearAllProducts,
        resetProductCount,
      }}>
      {children}
    </ProductContext.Provider>
  );
};

export default ProductProvider;

export const useProduct = () => useContext(ProductContext);
