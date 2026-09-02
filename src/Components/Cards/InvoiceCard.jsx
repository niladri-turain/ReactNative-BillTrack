import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {memo, useState, useMemo, useRef, useCallback} from 'react';
import {fonts} from '../../utils/fonts';
import {colors} from '../../utils/colors';
import DottedDivider from '../Dividers/DottedDivider';
import Lucide from '@react-native-vector-icons/lucide';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useNavigation} from '@react-navigation/native';
import {gap, padding, font, icon} from '../../utils/responsive';
import {calculateInvoiceData, formatDate} from '../../utils/helper';
import {usePrinter} from '../../Contexts/PrinterContext';
import printerService from '../../utils/PrinterService';
import {invoiceService} from '../../Services/InvoiceService';
import {CommonModal} from '..';
import {
  useAuth,
  useAuthToken,
  useBusiness,
  useSubscription,
} from '../../Contexts/AuthContext';
import {sendToWhatsApp} from '../../utils/WhatsappShare';
import {
  useAppSettings,
  useAppSettingsValue,
} from '../../Contexts/AppSettingContexts';
import {smsService} from '../../Services/SmsService';

// const {width} = Dimensions.get('screen');

const InvoiceCard = ({invoice, onRefresh}) => {
  const {setIsLoading} = useAuth();
  const {printer, setSelectedPrinter} = usePrinter();
  const business = useBusiness();
  const isPremiumPlanAndActive = useSubscription('isPremiumPlanAndActive');
  const token = useAuthToken();

  const sentWhatAppEnabled = useAppSettingsValue('SEND_TO_WHATSAPP');
  const sentSmsEnabled = useAppSettingsValue('SEND_TO_SMS');
  const printOnCreateBill = useAppSettingsValue('PRINT_ON_CREATE_BILL');
  const [isPrintingLoading, setIsPrintingLoading] = useState(false);
  const [isSmsLoading, setIsSmsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [isPendingPrint, setIsPendingPrint] = useState(false);
  const [isScannerModalVisible, setIsScannerModalVisible] = useState(false);

  const handleOpenScanner = useCallback(() => {
    setIsScannerModalVisible(true);
    startScan();
  }, []);

  const handleCloseScanner = useCallback(() => {
    setIsScannerModalVisible(false);
    setIsPendingPrint(false);
  }, []);

  const startScan = async () => {
    setIsScanning(true);
    try {
      const allDevices = await printerService.scanDevices();
      setDevices(allDevices);
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleDeviceSelect = async device => {
    setIsScanning(true);
    try {
      const connected = await printerService.connectDevice(device.address);
      if (connected) {
        await setSelectedPrinter(device);
        ToastAndroid.show('Printer connected successfully', ToastAndroid.SHORT);
        handleCloseScanner();

        // If we were waiting to print, trigger it now
        if (isPendingPrint) {
          setIsPendingPrint(false);
          printBill();
        }
      } else {
        ToastAndroid.show('Failed to connect printer', ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setIsScanning(false);
    }
  };



  const navigation = useNavigation();
  const sentToWhatsApp = async () => {
    if (!sentWhatAppEnabled) {
      Alert.alert(
        'Send WhatsApp Bill Not Enabled',
        'To continue, please enable Send WhatsApp Bill in the appsettings.',
      );
      return;
    }
    await sendToWhatsApp({
      businessName: business?.name,
      invoiceNumber: invoice?.invoiceNumber,
      createdAt: invoice?.createdAt,
      totalAmount: invoice?.totalAmount,
      paymentMode: invoice?.paymentMode,
      customerNumber: invoice?.customerNumber,
      businessId: business?.id,
    });
  };
  const cancelInvoice = async () => {
    Alert.alert(
      'Cancel Invoice',
      `Are you sure you want to cancel this invoice ${invoice?.invoiceNumber}?`,
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              setIsCancelling(true);
              const data = await invoiceService.cancelInvoiceById(
                token,
                invoice.id,
              );
              if (data?.status) {
                ToastAndroid.show(
                  data?.message || 'Invoice cancelled successfully',
                  ToastAndroid.SHORT,
                );
                if (onRefresh) {
                  onRefresh();
                }
              } else {
                ToastAndroid.show(
                  data?.message || 'Failed to cancel invoice',
                  ToastAndroid.SHORT,
                );
              }
            } catch (error) {
              ToastAndroid.show(
                'An error occurred while cancelling invoice.',
                ToastAndroid.SHORT,
              );
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ],
      {cancelable: false},
    );
  };

  const sentSms = async () => {
    if (!sentSmsEnabled || !isPremiumPlanAndActive) {
      Alert.alert(
        'Send SMS Not Enabled',
        'To continue, please enable Send SMS in the app settings.',
      );
      return;
    }
    if (!invoice?.customerNumber) {
      ToastAndroid.show('Customer Number Not Found', ToastAndroid.SHORT);
      return;
    }
    Alert.alert('Send SMS', 'Do you want to send this SMS?', [
      {
        text: 'Cancel',
        onPress: () =>
          ToastAndroid.show('SMS sending cancelled', ToastAndroid.SHORT),
        style: 'cancel',
      },
      {
        text: 'Send',
        onPress: async () => {
          try {
            setIsSmsLoading(true);
            console.log("invoice",invoice)
            const {invoiceNumber, totalAmount, customerNumber,businessId} = invoice;

            const data = await smsService.sendInvoiceSms({
              token: token,
              businessName: business?.name,
              phone: customerNumber,
              invoiceNumber: invoiceNumber,
              totalAmount: totalAmount,
              businessId: businessId,
            });
            if (data?.status) {
              ToastAndroid.show('SMS sent successfully', ToastAndroid.SHORT);
            } else {
              throw new Error(data?.message);
            }
          } catch (error) {
            ToastAndroid.show('Failed to send SMS', ToastAndroid.SHORT);
          } finally {
            setIsSmsLoading(false);
          }
        },
      },
    ]);
  };

  const printBill = async () => {
    if (!printer) {
      setIsPendingPrint(true);
      handleOpenScanner();
      return;
    }
    try {
      setIsPrintingLoading(true);
      const invoiceItems = await invoiceService.getInvoiceItems(invoice?.id);
      const {gstListCalculate, items, subTotalAmount, totalQuantity} =
        calculateInvoiceData(invoiceItems?.items, invoice?.discountAmount);
      await printerService.printInvoice(
        invoice,
        items,
        gstListCalculate,
        totalQuantity,
        subTotalAmount,
        business,
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsPrintingLoading(false);
    }
  };

  const isCancelled = invoice?.status?.toLowerCase() === 'canceled';

  return (
    <View
      style={[
        styles.mainContainer,
        isCancelled && {borderColor: colors.error, borderWidth: 0.5},
      ]}>
      <View style={styles.container}>
        <View style={styles.left}>
          <Text style={[styles.tsText]}>{invoice?.invoiceNumber}</Text>
          {invoice?.customerNumber && (
            <Text style={[styles.numberText]}>
              +91 {invoice?.customerNumber}
            </Text>
          )}
        </View>
        <Text style={[styles.dateText]}>{formatDate(invoice?.createdAt)}</Text>
        <View style={styles.right}>
          <View style={invoice?.status?.toLowerCase() === 'paid' ? styles.paidContainer : styles.paidContainerError}>
            <Text style={[invoice?.status?.toLowerCase() === 'paid' ? styles.paidText : styles.paidTextError]}>
              {invoice?.status.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.priceText]}>₹ {invoice?.totalAmount}</Text>
        </View>
      </View>
      <DottedDivider />
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.subBottomContainer}
          onPress={sentSms}
          disabled={isSmsLoading}>
          {isSmsLoading ? (
            <ActivityIndicator size={'small'} color={'#007aff'} />
          ) : (
            <Lucide
              name="message-square-text"
              size={icon(18)}
              color={'#007aff'}
            />
          )}
          <Text style={[{color: '#007aff'}, styles.subBottomContainerText]}>
            SMS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.subBottomContainer}
          onPress={sentToWhatsApp}>
          <Ionicons name="logo-whatsapp" size={icon(18)} color={'#04bd01'} />
          <Text style={[{color: '#04bd01'}, styles.subBottomContainerText]}>
            Whatsapp
          </Text>
        </TouchableOpacity>
        {printOnCreateBill && (
          <TouchableOpacity
            style={styles.subBottomContainer}
            onPress={printBill}
            disabled={isPrintingLoading}>
            {isPrintingLoading ? (
              <ActivityIndicator size={'small'} color={'#ff393c'} />
            ) : (
              <Lucide name="printer" size={icon(18)} color={'#ff393c'} />
            )}
            <Text style={[{color: '#ff393c'}, styles.subBottomContainerText]}>
              Print
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.subBottomContainer}
          onPress={() => {
            navigation.navigate('InvoiceDetails', {invoice: invoice});
          }}>
          <Lucide name="eye" size={icon(18)} color={'#00000090'} />
          <Text style={[{color: '#00000090'}, styles.subBottomContainerText]}>
            Details
          </Text>
        </TouchableOpacity>
        {invoice?.status?.toLowerCase() === 'paid' && (
          <TouchableOpacity
            style={styles.subBottomContainer}
            onPress={cancelInvoice}
            disabled={isCancelling}>
            {isCancelling ? (
              <ActivityIndicator size={'small'} color="red" />
            ) : (
              <Ionicons name="close-circle-outline" size={icon(18)} color="red" />
            )}
            <Text style={[{color: '#e21717'}, styles.subBottomContainerText]}>
              Cancel
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bluetooth Scanner Modal */}
      <CommonModal
        visible={isScannerModalVisible}
        handleClose={handleCloseScanner}>
        <View style={styles.modalContent}>
          <View style={styles.bottomSheetContaienr}>
            <Text style={styles.bottomSheetTitleText}>Select Printer</Text>
            <TouchableOpacity onPress={handleCloseScanner}>
              <Ionicons name="close" size={24} color={'#000'} />
            </TouchableOpacity>
          </View>

          <View style={{maxHeight: 400}}>
            {isScanning ? (
              <View style={{marginVertical: 20, alignItems: 'center'}}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{marginTop: 10, fontFamily: fonts.popRegular}}>
                  Scanning for devices...
                </Text>
              </View>
            ) : (
              <FlatList
                data={devices}
                keyExtractor={item => item.address}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={styles.deviceItem}
                    onPress={() => handleDeviceSelect(item)}>
                    <Ionicons
                      name="print-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <View style={{marginLeft: 15}}>
                      <Text style={styles.deviceName}>
                        {item.name || 'Unknown Device'}
                      </Text>
                      <Text style={styles.deviceAddress}>{item.address}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <Text style={{textAlign: 'center', marginVertical: 20}}>
                    No devices found. Make sure Bluetooth is on.
                  </Text>
                )}
              />
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.bottomSheetButton,
              {backgroundColor: colors.primary, marginTop: 20},
            ]}
            onPress={startScan}>
            <Text style={styles.bottomSheetButtonText}>RE-SCAN</Text>
          </TouchableOpacity>
        </View>
      </CommonModal>
    </View>
  );
};

export default memo(InvoiceCard);

const styles = StyleSheet.create({
  mainContainer: {
    // height: 100,
    backgroundColor: '#fff',
    justifyContent: 'center',
    borderRadius: 5,
    paddingVertical: padding(10),
  },
  container: {
    // height: 65,
    // borderRadius: 5,
    paddingHorizontal: padding(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    gap: 6,
  },
  tsText: {
    fontSize: font(14),
    fontFamily: fonts.inBold,
    color: colors.primary,
  },
  numberText: {
    fontSize: font(12),
    fontFamily: fonts.inRegular,
    color: '#00000080',
  },
  right: {
    gap: 6,
    alignItems: 'flex-end',
  },
  paidContainer: {
    backgroundColor: colors.sucess + 30,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: padding(3),
    paddingHorizontal: padding(8),
  },
    paidContainerError: {
    backgroundColor: colors.error + 30,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: padding(3),
    paddingHorizontal: padding(8),
  },
  paidText: {
    fontSize: font(8),
    fontFamily: fonts.inSemiBold,
    color: colors.sucess,
  },
   paidTextError: {
    fontSize: font(8),
    fontFamily: fonts.inSemiBold,
    color: colors.error,
  },
  priceText: {
    fontSize: font(14),
    fontFamily: fonts.inSemiBold,
    color: '#000000',
  },
  dateText: {
    fontSize: font(10),
    fontFamily: fonts.inRegular,
    color: '#00000080',
    textDecorationLine: 'underline',
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: padding(16),
  },
  subBottomContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap(5),
  },
  subBottomContainerText: {
    fontSize: font(11),
    fontFamily: fonts.inBold,
  },
  bottomSheetContaienr: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomSheetTitleText: {
    fontSize: font(16),
    fontFamily: fonts.popMedium,
    color: '#000',
  },
  bottomSheetButton: {
    paddingVertical: padding(6),
    paddingHorizontal: padding(20),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  bottomSheetButtonText: {
    fontSize: font(14),
    fontFamily: fonts.popSemiBold,
    color: '#fff',
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  deviceName: {
    fontFamily: fonts.popSemiBold,
    fontSize: font(14),
    color: '#000',
  },
  deviceAddress: {
    fontFamily: fonts.popRegular,
    fontSize: font(12),
    color: '#666',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: padding(20),
    width: '100%',
  },
});
