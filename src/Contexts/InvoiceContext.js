import {createContext, useCallback, useContext, useMemo, useState} from 'react';

const InvoiceContext = createContext();

const InvoiceProvider = ({children}) => {
  const [invoices, setInvoices] = useState([]);
  const [invoicesFetched, setInvoicesFetched] = useState(false);
  const [salesData, setSalesData] = useState(null);

  const addInvoice = useCallback(invoice => {
    setInvoices(prevInvoices => [invoice, ...prevInvoices]);
  }, []);

  const resetInvoices = useCallback((invoices = []) => {
    setInvoices(invoices);
    setInvoicesFetched(true);
  }, []);

  const clearInvoice = useCallback(() => {
    setInvoices([]);
    setInvoicesFetched(false);
  }, []);

  const value = useMemo(
    () => ({
      invoices,
      invoicesFetched,
      addInvoice,
      resetInvoices,
      clearInvoice,
      salesData,
      setSalesData,
    }),
    [invoices, invoicesFetched, addInvoice, resetInvoices, clearInvoice, salesData],
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
