import AsyncStorage from '@react-native-async-storage/async-storage';
import {createContext, useContext, useEffect, useState} from 'react';

const PrinterContext = createContext();

const PRINTER_KEY = 'PRINTER';

const PrinterProvider = ({children}) => {
  const [printer, setPrinter] = useState(null);

  const setSelectedPrinter = async selectedPrinter => {
    await clearPrinter();
    setPrinter(selectedPrinter);
  };

  const setAsDefaultPrinter = async printerToSave => {
    try {
      await clearPrinter();
      await AsyncStorage.setItem(PRINTER_KEY, JSON.stringify(printerToSave));
      setPrinter(printerToSave);
    } catch (error) {
    }
  };

  const getPrinter = async () => {
    try {
      const storedPrinter = await AsyncStorage.getItem(PRINTER_KEY);
      if (storedPrinter) {
        setPrinter(JSON.parse(storedPrinter));
      }
    } catch (error) {
    }
  };

  const clearPrinter = async () => {
    try {
      await AsyncStorage.removeItem(PRINTER_KEY);
      setPrinter(null);
    } catch (error) {
    }
  };

  useEffect(() => {
    getPrinter();
  }, []);

  const value = {
    printer,
    setSelectedPrinter,
    setAsDefaultPrinter,
    getPrinter,
    clearPrinter,
  };

  return (
    <PrinterContext.Provider value={value}>{children}</PrinterContext.Provider>
  );
};

export const usePrinter = () => useContext(PrinterContext);

export default PrinterProvider;
