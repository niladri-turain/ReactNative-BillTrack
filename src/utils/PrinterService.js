import {
  BluetoothManager,
  BluetoothEscposPrinter,
} from 'react-native-bluetooth-escpos-printer';
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import {formatDate} from './helper';

class PrinterService {
  async requestPermission() {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 31) {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);
          return (
            granted['android.permission.BLUETOOTH_SCAN'] ===
              PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.BLUETOOTH_CONNECT'] ===
              PermissionsAndroid.RESULTS.GRANTED
          );
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  }

  async scanDevices() {
    try {
      const granted = await this.requestPermission();
      if (!granted) return [];

      const devices = await BluetoothManager.scanDevices();
      const parsedDevices = JSON.parse(devices);
      const allDevices = [
        ...(parsedDevices.paired || []),
        ...(parsedDevices.found || []),
      ];

      const uniqueDevices = Array.from(new Set(allDevices.map(d => d.address)))
        .map(address => allDevices.find(d => d.address === address))
        .filter(d => d && d.address);

      return uniqueDevices;
    } catch (error) {
      console.error('Scan Error:', error);
      return [];
    }
  }

  async connectDevice(address) {
    try {
      await BluetoothManager.connect(address);
      return true;
    } catch (error) {
      console.error('Connection Error:', error);
      return false;
    }
  }

  convertTo12Hour = datetime => {
    if (!datetime) return '';
    let date;
    try {
      if (typeof datetime === 'string') {
        date = new Date(datetime.replace(' ', 'T'));
      } else {
        date = new Date(datetime);
      }
    } catch (e) {
      date = new Date(datetime);
    }
    if (!date || isNaN(date.getTime())) return '';
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const mins = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${mins} ${ampm}`;
  };

  cleanAmount = val => {
    if (val === undefined || val === null) return '0.00';
    // Remove all characters except digits, decimal point, and minus sign
    const cleaned = String(val).replace(/[^\d.-]/g, '');
    if (!cleaned || cleaned === '.') return '0.00';
    return parseFloat(cleaned).toFixed(2);
  };

  async printInvoice(
    invoice,
    invoiceItems,
    gstList,
    totalQuantity,
    subTotalAmount,
    business,
    printerSize = '58',
  ) {
    try {
      // 58mm printer usually 32 characters
      const lineLength = 32;
      const dashLine = '-'.repeat(lineLength) + '\n';

      // Header
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.setBlob(0);
      await BluetoothEscposPrinter.printText(`${business?.name || ''}\n`, {
        encoding: 'GBK',
        codepage: 0,
        widthtimes: 1,
        heigthtimes: 1,
        fonttype: 1,
      });

      if (business?.phone) {
        await BluetoothEscposPrinter.printText(`Phone Number: ${business.phone}\n`, {});
      }
      await BluetoothEscposPrinter.printText(`Address: ${business?.street || ''} ${business?.city || ''}\n`, {});
      if (business?.gstNumber) {
        await BluetoothEscposPrinter.printText(`GST NO : ${business.gstNumber}\n`, {});
      }
      await BluetoothEscposPrinter.printText(dashLine, {});

      // Invoice Info - Date and Time on separate lines to avoid wrapping
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      await BluetoothEscposPrinter.printText(`Invoice No : ${invoice.invoiceNumber}\n`, {});
      await BluetoothEscposPrinter.printText(`Date : ${formatDate(invoice.createdAt)}\n`, {});
      await BluetoothEscposPrinter.printText(`Time : ${this.convertTo12Hour(invoice.createdAt)}\n`, {});
      if (invoice.customerNumber) {
        await BluetoothEscposPrinter.printText(`Customer : ${invoice.customerNumber}\n`, {});
      }
      await BluetoothEscposPrinter.printText(dashLine, {});

      // Table Header
      // 12 (Item) + 4 (Qt) + 8 (Price) + 8 (Amount) = 32
      const columnWidths = [12, 4, 8, 8];
      await BluetoothEscposPrinter.printColumn(
        columnWidths,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT, BluetoothEscposPrinter.ALIGN.RIGHT],
        ['Item', 'Qt', 'Price', 'Amount'],
        {}
      );
      await BluetoothEscposPrinter.printText(`HSN (GST)\n`, {});
      await BluetoothEscposPrinter.printText(dashLine, {});

      // Items
      for (const item of invoiceItems) {
        const name = item.productName || item.name || '';
        const qty = (item.quantity || 0).toString();
        const price = this.cleanAmount(item.originalPrice);
        const amount = (parseFloat(price) * parseInt(item.quantity || 0)).toFixed(2);

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT, BluetoothEscposPrinter.ALIGN.RIGHT],
          [name, qty, price, amount],
          {}
        );

        // HSN/GST info below item
        let hsnInfo = '';
        if (item.hsn) hsnInfo += item.hsn;
        if (item.gstPercentage) hsnInfo += ` (${item.gstPercentage}%)`;
        if (hsnInfo.trim()) {
          await BluetoothEscposPrinter.printText(`${hsnInfo.trim()}\n`, {});
        }
      }
      await BluetoothEscposPrinter.printText(dashLine, {});

      // Summary - Each on a single line using printColumn for clean left/right alignment
      const summaryWidths = [20, 12];

      await BluetoothEscposPrinter.printColumn(
        summaryWidths,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        ['Total Quantity :', totalQuantity.toString()],
        {}
      );

      await BluetoothEscposPrinter.printColumn(
        summaryWidths,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        ['Sub Total :', this.cleanAmount(subTotalAmount)],
        {}
      );

      if (parseFloat(this.cleanAmount(invoice?.discountAmount)) > 0) {
        await BluetoothEscposPrinter.printColumn(
          summaryWidths,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
          ['Total Discount :', this.cleanAmount(invoice.discountAmount)],
          {}
        );
      }

      // GST Details
      if (gstList && gstList.length > 0) {
        await BluetoothEscposPrinter.printText(dashLine, {});
        for (const gst of gstList) {
          await BluetoothEscposPrinter.printColumn(
            summaryWidths,
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
            [`${gst.gstType} ${gst.gstPercentage}% :`, this.cleanAmount(gst.gstAmount)],
            {}
          );
        }
      }

      await BluetoothEscposPrinter.printText(dashLine, {});

      // Payment Method
      await BluetoothEscposPrinter.printColumn(
        summaryWidths,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        ['Payment :', String(invoice.paymentMethod || 'CASH').toUpperCase()],
        {}
      );

      // Final Total Amount
      await BluetoothEscposPrinter.setBlob(1);
      await BluetoothEscposPrinter.printColumn(
        summaryWidths,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        ['Total Amount :', this.cleanAmount(invoice.totalAmount)],
        {}
      );
      await BluetoothEscposPrinter.setBlob(0);

      await BluetoothEscposPrinter.printText(dashLine, {});

      // Footer
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText('Thank You & Visit Again\n', {});
      await BluetoothEscposPrinter.printText('\n\n', {});
      await BluetoothEscposPrinter.cutPaper();

      return true;
    } catch (error) {
      console.error('Print Error:', error);
      return false;
    }
  }
}

const printerService = new PrinterService();
export default printerService;
