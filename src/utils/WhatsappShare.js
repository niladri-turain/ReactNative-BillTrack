import {Alert, Linking, ToastAndroid} from 'react-native';
import {formatDate} from './helper';

const sendToWhatsApp = async ({
  customerNumber,
  invoiceNumber,
  createdAt,
  totalAmount,
  paymentMode,
  businessName,
  businessId,
}) => {
  // Safety check
  if (!customerNumber) {
    ToastAndroid.show('Customer mobile number not found', ToastAndroid.SHORT);
    return;
  }

  // Make sure phone number is in international format
  let phoneNumber = customerNumber.trim();

  // If number doesn't start with +, and it's 10 digits (Indian), add +91
  if (!phoneNumber.startsWith('+')) {
    if (phoneNumber.length === 10) {
      phoneNumber = '+91' + phoneNumber;
    } else {
      phoneNumber = '+' + phoneNumber; // fallback
    }
  }

  // Your beautiful WhatsApp message
  const message = `Invoice Paid – Thank You!

*${businessName}*

━━━━━━━━━━━━━━━━━
Invoice No.:   ${invoiceNumber}
Date:              ${formatDate(createdAt)}
Customer:      ${customerNumber}
Amount Paid:  ₹${totalAmount}
Paid via:          ${paymentMode || 'Cash'}
━━━━━━━━━━━━━━━━━

Thank you for your payment!

Download Invoice:
https://bill.billtrack.co.in/invoice-details/${invoiceNumber}9876543210/${businessId}1234567890

Need help? Just reply here.

Warm regards,
Team ${businessName}`;

  console.log(message);

  const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(
    message,
  )}`;

  try {
    const canOpen = await Linking.canOpenURL(whatsappUrl);

    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else {
      // Fallback to web if WhatsApp app not installed
      const webUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
        message,
      )}`;
      await Linking.openURL(webUrl);
    }
  } catch (error) {
    Alert.alert(
      'WhatsApp Not Found',
      'Please install WhatsApp to share invoice.',
    );
  }
};

export {sendToWhatsApp};
