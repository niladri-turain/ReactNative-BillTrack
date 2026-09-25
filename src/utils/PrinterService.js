import {
  BluetoothManager,
  BluetoothEscposPrinter,
} from 'react-native-bluetooth-escpos-printer';
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import {formatDate} from './helper';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      // Combine paired and found devices
      const allDevices = [
        ...(parsedDevices.paired || []),
        ...(parsedDevices.found || []),
      ];

      // Filter out null/undefined or duplicate addresses
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
    const date = new Date(datetime.replace(' ', 'T'));
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
      const columnWidths = [12, 4, 8, 8]; // Item (12), Qty (4), Price (8), Amount (8) = 32

      // Header
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.setBlob(0);
      await BluetoothEscposPrinter.printText(`${business?.name || ''}\n\n`, {
        encoding: 'GBK',
        codepage: 0,
        widthtimes: 1,
        heigthtimes: 1,
        fonttype: 1,
      });

      if (business?.phone) {
        await BluetoothEscposPrinter.printText(`Phone: ${business.phone}\n`, {});
      }
      await BluetoothEscposPrinter.printText(`${business?.street || ''} ${business?.city || ''}\n`, {});
      if (business?.gstNumber) {
        await BluetoothEscposPrinter.printText(`GST: ${business.gstNumber}\n`, {});
      }
      await BluetoothEscposPrinter.printText(dashLine, {});

      // Invoice Info
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      await BluetoothEscposPrinter.printText(`Invoice No : ${invoice.invoiceNumber}\n`, {});
      await BluetoothEscposPrinter.printText(`Date : ${formatDate(invoice.createdAt)}\n`, {});
      await BluetoothEscposPrinter.printText(`Time : ${this.convertTo12Hour(invoice.createdAt)}\n`, {});
      if (invoice.customerNumber) {
        await BluetoothEscposPrinter.printText(`Customer : ${invoice.customerNumber}\n`, {});
      }
      await BluetoothEscposPrinter.printText(dashLine, {});

      // Table Header
      await BluetoothEscposPrinter.printColumn(
        columnWidths,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ['Item', 'Qty', 'Price', 'Amount'],
        {},
      );
      if (gstList && gstList.length > 0) {
        await BluetoothEscposPrinter.printText('HSN (GST)\n', {fonttype: 1});
      }
      await BluetoothEscposPrinter.printText(dashLine, {});

      // Items
      for (const item of invoiceItems) {
        const name = item.productName || item.name || '';
        const qty = (item.quantity || 0).toString();
        const price = this.cleanAmount(item.originalPrice);
        const amount = this.cleanAmount(parseFloat(price) * parseInt(qty));

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [name, qty, price, amount],
          {},
        );

        // HSN/GST info below item
        const hsnCode =
          (typeof item.hsn === 'object' ? item.hsn?.hsnCode : item.hsn) ||
          item.hsnCode ||
          '';
        const gstRate =
          item.gstPercentage && parseFloat(item.gstPercentage) > 0
            ? `${parseFloat(item.gstPercentage)}%`
            : '';
        const hsnInfo = `${hsnCode}${gstRate ? `(${gstRate})` : ''}`;

        if (hsnInfo.trim()) {
          await BluetoothEscposPrinter.printText(`${hsnInfo.trim()}\n`, {
            fonttype: 1,
          });
        }
      }
      await BluetoothEscposPrinter.printText(dashLine, {});

      // Summary
      const summaryWidths = [20, 12];

      await BluetoothEscposPrinter.printColumn(
        summaryWidths,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ['Total Quantity :', totalQuantity.toString()],
        {},
      );

      await BluetoothEscposPrinter.printColumn(
        summaryWidths,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ['Sub Total :', this.cleanAmount(subTotalAmount)],
        {},
      );

      if (parseFloat(this.cleanAmount(invoice?.discountAmount)) > 0) {
        await BluetoothEscposPrinter.printColumn(
          summaryWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ['Total Discount :', this.cleanAmount(invoice.discountAmount)],
          {},
        );
      }

      // GST Breakdown
      if (gstList && gstList.length > 0) {
        for (const gst of gstList) {
          await BluetoothEscposPrinter.printColumn(
            summaryWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              `${gst.gstType} ${gst.gstPercentage}% :`,
              this.cleanAmount(gst.gstAmount),
            ],
            {},
          );
        }
      }

      await BluetoothEscposPrinter.printText(dashLine, {});

      // Payment Method
      await BluetoothEscposPrinter.printColumn(
        summaryWidths,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ['Payment :', String(invoice.paymentMode || 'CASH').toUpperCase()],
        {},
      );

      // Final Total Amount
      await BluetoothEscposPrinter.setBlob(1);
      await BluetoothEscposPrinter.printColumn(
        summaryWidths,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ['Total Amount :', this.cleanAmount(invoice.totalAmount)],
        {},
      );
      await BluetoothEscposPrinter.setBlob(0);
      await BluetoothEscposPrinter.printText(dashLine, {});

      // Footer
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText('Thank You & Visit Again\n', {});

      // Auto-increment Token Logic
      try {
        let tokenCount = await AsyncStorage.getItem('print_token_count');
        tokenCount = tokenCount ? parseInt(tokenCount) + 1 : 1;
        await AsyncStorage.setItem('print_token_count', tokenCount.toString());

        await BluetoothEscposPrinter.printText('\n', {});
        await BluetoothEscposPrinter.setBlob(1);
        await BluetoothEscposPrinter.printText(`Token ${tokenCount}\n`, {
          widthtimes: 1,
          heigthtimes: 1,
        });
        await BluetoothEscposPrinter.setBlob(0);
      } catch (e) {
        console.error('Token increment error:', e);
      }

      // UPI QR Code for Payment
      try {
        const upiId = '7059238072@ybl';
        const totalAmount = this.cleanAmount(invoice.totalAmount);
        const businessName = business?.name || 'Payment';
        const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${totalAmount}&cu=INR`;

        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
        await BluetoothEscposPrinter.printText('\nScan to Pay\n', {});
        await BluetoothEscposPrinter.printQRCode(upiUrl, 200, BluetoothEscposPrinter.ERROR_CORRECTION.L);
        await BluetoothEscposPrinter.printText(`\nAmount: RS ${totalAmount}\n`, {fonttype: 1});
        await BluetoothEscposPrinter.printText(`UPI ID: ${upiId}\n`, {fonttype: 1});
      } catch (e) {
        console.error('QR Code print error:', e);
      }

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
