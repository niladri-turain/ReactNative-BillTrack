import {createContext, useContext, useMemo, useState} from 'react';

const InvoiceContext = createContext();

const InvoiceProvider = ({children}) => {
  const [invoices, setInvoices] = useState([]);
  const [salesData, setSalesData] = useState(null);

  const addInvoice = invoice => {
    setInvoices(prevInvoices => [invoice, ...prevInvoices]);
  };

  const resetInvoices = (invoices = []) => {
    setInvoices(invoices);
  };

  const clearInvoice = () => {
    setInvoices([]);
  };

  const value = useMemo(
    () => ({
      invoices,
      addInvoice,
      resetInvoices,
      clearInvoice,
      salesData,
      setSalesData,
    }),
    [invoices, salesData],
  );

  return (
    <InvoiceContext.Provider value={value}>{children}</InvoiceContext.Provider>
  );
};

export const useInvoice = attribute => {
  const context = useContext(InvoiceContext);
  if (attribute) {
    return context[attribute];
  }
  return context;
};

export default InvoiceProvider;
