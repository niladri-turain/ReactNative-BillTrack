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
    return false;
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

  // Shorten URL logic using sttn.in POST API
  const longUrl = `https://dev.billtrack.co.in/invoice-details/${invoiceNumber}9876543210/${businessId}1234567890`;
  let invoiceUrl = longUrl;

  try {
    const response = await fetch('https://sttn.in/api/shorten', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vyc19pZCI6NzIsIm1vYmlsZSI6IjcwNTkyMzgwNzIiLCJpYXQiOjE3ODg1OTA0MTYsImV4cCI6MTgyMDE0ODAxNn0.qgl2gK_LZnil3pwUcGWpwofxMNGBUZic1cdnmabU0ws'
      },
      body: JSON.stringify({
        originalUrl: longUrl,
        type: 'static'
      })
    });
    const data = await response.json();
    console.log('[WhatsappShare] Shorten response:', data);
    if (data.shortUrl) {
      invoiceUrl = data.shortUrl.replace('/api/shorten', '');
    }
  } catch (error) {
    console.log('URL shortening failed, using original URL:', error);
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
${invoiceUrl}

Need help? Just reply here.

Warm regards,
Team ${businessName}`;

  console.log(message);
  console.log(invoiceUrl);

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
    return true;
  } catch (error) {
    Alert.alert(
      'WhatsApp Not Found',
      'Please install WhatsApp to share invoice.',
    );
    return false;
  }
};

export {sendToWhatsApp};
