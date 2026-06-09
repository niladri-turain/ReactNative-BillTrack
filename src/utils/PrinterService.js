import BLEPrinter from 'react-native-bluetooth-classic';
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import {formatDate, formatTime12Hour} from './helper';

class PrinterService {
  async requestPermission() {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        const permissions = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return (
          permissions['android.permission.BLUETOOTH_CONNECT'] === 'granted'
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true;
  }

  async detectDevices() {
    try {
      const granted = await this.requestPermission();
      if (!granted) {
        Alert.alert('Permission Denied');
        return null;
      }
      const isBluetoothEnabled = await BLEPrinter.isBluetoothEnabled();
      if (!isBluetoothEnabled) {
        Alert.alert('Please enable Bluetooth');
        return null;
      }
      const bondedPrinters = await BLEPrinter.getBondedDevices();
      return bondedPrinters;
    } catch (error) {
      return null;
    }
  }

  convertTo12Hour=(datetime)=> {
    const date = new Date(datetime.replace(" ", "T"));
    
    let hours = date.getHours();
    const minutes = date.getMinutes();
    
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    
    const mins = minutes < 10 ? "0" + minutes : minutes;
    
    return `${hours}:${mins} ${ampm}`;
}

  async printInvoice(
    printer,
    invoice,
    invoiceItems,
    gstList,
    totalQuantity,
    subTotalAmount,
    business,
  ) {
    try {
      const granted = await this.requestPermission();
      if (!granted) {
        Alert.alert('Permission Denied');
        return null;
      }
      const address = printer?.address;
      const printerSize = printer?.printerSize || '80'; // Default to 80mm

      const connection = await BLEPrinter.connectToDevice(address);
      if (!connection) {
        Alert.alert(
          'Printer Not Connected',
          'Unable to establish connection with the printer. Please ensure the printer is turned on and within range.',
        );
        return null;
      }
      await connection.connect();

      const ESC = '\x1B';
      const GS = '\x1D';
      const INIT = ESC + '@';
      const ALIGN_CENTER = ESC + 'a' + '1';
      const ALIGN_LEFT = ESC + 'a' + '0';
      const ALIGN_RIGHT = ESC + 'a' + '2';
      const BOLD_ON = ESC + 'E' + '1';
      const BOLD_OFF = ESC + 'E' + '0';
      const SIZE_NORMAL = GS + '!' + '\x00';
      const SIZE_LARGE = GS + '!' + '\x11';
      const SIZE_MEDIUM = GS + '!' + '\x00';
      const SIZE_INBETWEEN = GS + '!' + '\x01';
      const CUT_PAPER = GS + 'V' + '1';
      const LINE_FEED = '\n';
      const LINE_SPACING_NORMAL = '\x1B\x32'; // ESC 2

      // Set layout configuration based on printer size
      const config = this.getPrinterConfig(printerSize);
      const DOTTED_LINE = '-'.repeat(config.lineWidth);

      let printData = INIT;

      // Header - Business Info (Centered)
      printData += ALIGN_CENTER;
      printData += SIZE_INBETWEEN + BOLD_ON;
      printData += LINE_SPACING_NORMAL;
      printData += `${business?.name}${LINE_FEED}`;
      printData += SIZE_NORMAL + BOLD_OFF;

      if (business?.phone) {
        printData += `Phone: ${business.phone}${LINE_FEED}`;
      }

      printData += `${business?.street || ''}${LINE_FEED}`;
      printData += `${business?.city || ''}, ${
        business?.state || ''
      }${LINE_FEED}`;
      printData += `${business?.pinCode || ''}${LINE_FEED}`;

      if (business?.gstNumber) {
        printData += `GST NO: ${business.gstNumber}${LINE_FEED}`;
      }

      printData += DOTTED_LINE + LINE_FEED;

      // Invoice Details
      printData += ALIGN_LEFT;
      printData += `Invoice No: ${invoice.invoiceNumber}${LINE_FEED}`;
      printData += `Date: ${formatDate(invoice.createdAt)}${LINE_FEED}`;
      printData += `Time: ${this.convertTo12Hour(invoice.createdAt)}${LINE_FEED}`;

      if (invoice.customerNumber) {
        printData += `Customer: +91 ${invoice.customerNumber}${LINE_FEED}`;
      }

      printData += DOTTED_LINE + LINE_FEED;

      // Items Header
      printData += BOLD_ON;
      printData += this.formatLine('Item', 'Qty', 'Rate', 'Amount', config);
      printData += BOLD_OFF;
      printData += DOTTED_LINE + LINE_FEED;

      // Items - Now with full item name on separate line if needed
      invoiceItems.forEach(item => {
        const itemName = item.productName || item.name;
        const quantity = item.quantity.toString();
        const rate = parseFloat(item.originalPrice).toFixed(2);
        const amount = (
          parseFloat(item.originalPrice) * parseInt(item.quantity)
        ).toFixed(2);

        // Print full item name on its own line(s) if it's long
        if (itemName.length > config.itemNameWidth) {
          // Print full item name on separate line(s)
          printData += this.wrapText(itemName, config.lineWidth);
          // Print quantity, rate, amount on next line with proper spacing
          printData += this.formatLine('', quantity, rate, amount, config);
        } else {
          // Item name fits in one line with details
          printData += this.formatLine(
            itemName,
            quantity,
            rate,
            amount,
            config,
          );
        }
      });

      printData += DOTTED_LINE + LINE_FEED;

      // Totals
      printData += this.formatTotalLine(
        'Total Qty:',
        totalQuantity.toString(),
        config,
      );
      printData += this.formatTotalLine(
        'Sub Total:',
        `RS ${subTotalAmount.toFixed(2)}`,
        config,
      );

      const discountAmount=parseFloat(invoice
        ?.discountAmount);
      if(discountAmount>0){
        printData += this.formatTotalLine(
          'Discount:',
          `RS -${discountAmount.toFixed(2)}`,
          config,
        );
      }

      printData += DOTTED_LINE + LINE_FEED;

      // GST Details
      if (gstList && gstList.length > 0) {
        gstList.forEach(gst => {
          const gstLabel = `${gst.gstType} @ ${gst.gstPercentage}%`;
          const gstAmount = `RS ${gst.gstAmount.toFixed(2)}`;
          printData += this.formatTotalLine(gstLabel, gstAmount, config);
        });
        printData += DOTTED_LINE + LINE_FEED;
      }

      // Payment and Total
      printData += this.formatTotalLine(
        'Payment:',
        invoice?.paymentMode.toUpperCase(),
        config,
      );
      printData += BOLD_ON + SIZE_MEDIUM;
      printData += this.formatTotalLine(
        'Total Amount:',
        `RS ${invoice.totalAmount}`,
        config,
      );
      printData += SIZE_NORMAL + BOLD_OFF;

      printData += DOTTED_LINE + LINE_FEED;

      // Footer
      printData += ALIGN_CENTER + BOLD_ON;
      printData += `Thank You & Visit Again${LINE_FEED}`;
      printData += BOLD_OFF;

      // Cut paper
      printData += CUT_PAPER;
      // Send to printer
      await connection.write(printData);
      await connection.disconnect();
    } catch (error) {
      Alert.alert(
        'Printer Error',
        'Failed to print invoice. Please check if the printer is connected and try again.',
      );
      return null;
    }
  }

  // Get printer configuration based on size
  getPrinterConfig(printerSize) {
    const size = printerSize.toLowerCase();

    if (size.includes('58')) {
      // 58mm printer - smaller format
      return {
        lineWidth: 32,
        itemNameWidth: 10,
        qtyWidth: 3,
        rateWidth: 5,
        amountWidth: 7,
        totalLabelWidth: 20,
        totalValueWidth: 12,
      };
    } else if (size.includes('80')) {
      // 80mm printer - standard format
      return {
        lineWidth: 48,
        itemNameWidth: 18,
        qtyWidth: 5,
        rateWidth: 8,
        amountWidth: 10,
        totalLabelWidth: 28,
        totalValueWidth: 20,
      };
    } else if (size.includes('104')) {
      // 104mm printer - larger format
      return {
        lineWidth: 64,
        itemNameWidth: 28,
        qtyWidth: 6,
        rateWidth: 10,
        amountWidth: 12,
        totalLabelWidth: 40,
        totalValueWidth: 24,
      };
    } else {
      // Default to 80mm
      return {
        lineWidth: 48,
        itemNameWidth: 18,
        qtyWidth: 5,
        rateWidth: 8,
        amountWidth: 10,
        totalLabelWidth: 28,
        totalValueWidth: 20,
      };
    }
  }

  // New function to wrap long text across multiple lines
  wrapText(text, maxWidth) {
    let result = '';
    let currentLine = '';
    const words = text.split(' ');

    for (let word of words) {
      if ((currentLine + word).length <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          result += currentLine + '\n';
        }
        // If single word is longer than maxWidth, break it
        if (word.length > maxWidth) {
          while (word.length > maxWidth) {
            result += word.substring(0, maxWidth) + '\n';
            word = word.substring(maxWidth);
          }
          currentLine = word;
        } else {
          currentLine = word;
        }
      }
    }

    if (currentLine) {
      result += currentLine + '\n';
    }

    return result;
  }

  // formatLine(col1, col2, col3, col4, config) {
  //   const c1 = this.padRight(col1, config.itemNameWidth);
  //   const c2 = this.padLeft(col2, config.qtyWidth);
  //   const c3 = this.padLeft(col3, config.rateWidth);
  //   const c4 = this.padLeft(col4, config.amountWidth);
  //   return `${c1}${c2} ${c3} ${c4}\n`;
  // }
  formatLine(col1, col2, col3, col4, config) {
  const c1 = this.padRight(col1, config.itemNameWidth);
  const c2 = this.padLeft(col2, config.qtyWidth);
  const c3 = this.padLeft(col3, config.rateWidth);
  const c4 = this.padLeft(col4, config.amountWidth);
  return `${c1}  ${c2}  ${c3}  ${c4}\n`;
}

  // Helper function to format total lines (Label: Value)
  formatTotalLine(label, value, config) {
    const l = this.padRight(label, config.totalLabelWidth);
    const v = this.padLeft(value, config.totalValueWidth);
    return `${l}${v}\n`;
  }

  // Helper function to pad right
  padRight(str, length) {
    str = str.toString();
    while (str.length < length) {
      str += ' ';
    }
    return str.substring(0, length);
  }

  // Helper function to pad left
  padLeft(str, length) {
    str = str.toString();
    while (str.length < length) {
      str = ' ' + str;
    }
    return str.substring(0, length);
  }

  // Helper function to truncate string
  truncateString(str, maxLength) {
    if (str.length > maxLength) {
      return str.substring(0, maxLength - 2) + '..';
    }
    return str;
  }
}

const printerService = new PrinterService();

export default printerService;
