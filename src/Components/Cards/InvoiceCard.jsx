import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {memo, useState} from 'react';
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

const InvoiceCard = ({invoice}) => {
  const {setIsLoading} = useAuth();
  const {printer} = usePrinter();
  const business = useBusiness();
  const isPremiumPlanAndActive = useSubscription('isPremiumPlanAndActive');
  const token = useAuthToken();

  const sentWhatAppEnabled = useAppSettingsValue('SEND_TO_WHATSAPP');
  const sentSmsEnabled = useAppSettingsValue('SEND_TO_SMS');
  const [isPrintingLoading, setIsPrintingLoading] = useState(false);
  const [isSmsLoading, setIsSmsLoading] = useState(false);

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
    try {
      setIsPrintingLoading(true);
      if (!printer) {
        Alert.alert(
          'Printer Not Selected',
          'To continue, please set up a printer:\n\n1. Open the Accounts section.\n2. Go to Settings.\n3. Choose Printer Setup.\n4. Add or select an available printer.',
          [{text: 'OK', style: 'default'}],
        );

        return;
      }
      const invoiceItems = await invoiceService.getInvoiceItems(invoice?.id);
      const {gstListCalculate, items, subTotalAmount, totalQuantity} =
        calculateInvoiceData(invoiceItems?.items);
      await printerService.printInvoice(
        printer,
        invoice,
        items,
        gstListCalculate,
        totalQuantity,
        subTotalAmount,
        business,
      );
    } catch (error) {
    } finally {
      setIsPrintingLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
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
          <View style={styles.paidContainer}>
            <Text style={[styles.paidText]}>{invoice?.status.toUpperCase()}</Text>
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
        {isPremiumPlanAndActive && (
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
      </View>
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
  paidText: {
    fontSize: font(8),
    fontFamily: fonts.inSemiBold,
    color: colors.sucess,
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
    fontSize: font(12),
    fontFamily: fonts.inBold,
  },
});
