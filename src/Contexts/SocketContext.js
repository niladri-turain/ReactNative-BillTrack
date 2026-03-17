import {createContext, useEffect, useRef} from 'react';
import {io} from 'socket.io-client';
import {useAuth, useBusiness} from './AuthContext';
import {getDeviceDetails} from '../utils/DeviceInfo';
import {useProduct} from './ProductContexts';
import {usePrinter} from './PrinterContext';
import {useAppSettings} from './AppSettingContexts';
import {useInvoice} from './InvoiceContext';

const SocketContext = createContext();

const SocketProvider = ({children}) => {
  const socketRef = useRef(null);
  const businessId = useBusiness('id');
  const {clearAllProducts} = useProduct();
  const {clearPrinter} = usePrinter();
  const {resetSettings} = useAppSettings();
  const clearInvoice = useInvoice('clearInvoice');
  const {logout} = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      await clearAllProducts();
      await clearPrinter();
      await resetSettings();
      clearInvoice();
    } catch (error) {}
  };

  useEffect(() => {
    if (!businessId) {
      return;
    }
    socketRef.current = io('https://socket.api.smscannon.in', {
      transports: ['websocket'],
      auth: {
        user: businessId.toString(),
      },
    });
    socketRef.current.on('connect', () => {
    });

    socketRef.current.on('logout', async data => {
      const {deviceUniqueKey} = await getDeviceDetails();
      if (Array.isArray(data)) {
        const device = data.some(
          item => item.deviceUniqueKey === deviceUniqueKey,
        );
        if (device) {
          await handleLogout();
        }
      }
    });

    return () => {
      socketRef.current.off('logout');
      socketRef.current.off('connect');
      socketRef.current.disconnect();
    };
  }, [businessId, socketRef.current]);

  return (
    <SocketContext.Provider value={{socketRef}}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
