import {
  BluetoothManager,
  BluetoothEscposPrinter,
} from 'react-native-bluetooth-escpos-printer';
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import {formatDate} from './helper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {businessUpiService} from '../Services/BusinessUpiService';

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

  async getDefaultUpiId(token) {
    if (!token) return null;

    try {
      const response = await businessUpiService.getUpiIds(token);
      if (!response?.status || !Array.isArray(response?.data)) return null;

      const defaultUpi = response.data.find(
        item => item?.isDefault === true && item?.upiId?.trim(),
      );
      return defaultUpi?.upiId?.trim() || null;
    } catch (error) {
      console.error('Error fetching default UPI ID for printing:', error);
      return null;
    }
  }

  async printInvoice(
    invoice,
    invoiceItems,
    gstList,
    totalQuantity,
    subTotalAmount,
    breakdownTotalAmount,
    roundOffAmount,
    business,
    token,
    printerSize = '58',
  ) {
    const upiId = await this.getDefaultUpiId(token);
    if (!upiId) {
      Alert.alert(
        'UPI ID required',
        'Add a default UPI ID from Account > Payment Details before printing.',
      );
      return false;
    }

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
      const customer = invoice.customer || {};
      const customerGstin = invoice.customerGstin || customer.gstin;
      const customerName = invoice.customerName || customer.companyName;
      const customerAddress = invoice.customerAddress || customer.address;
      const customerState = invoice.customerStateName || customer.stateName || customer.state?.name;
      const hasBillToDetails =
        String(invoice.supplyType || customer.type || '').toUpperCase() === 'B2B' ||
        Boolean(customerName || customerGstin || customerAddress || customerState);
      if (hasBillToDetails) {
        await BluetoothEscposPrinter.printText('BILL TO\n', {fonttype: 1});
        if (customerName) {
          await BluetoothEscposPrinter.printText(`${customerName}\n`, {fonttype: 1});
        }
        if (customerAddress) {
          await BluetoothEscposPrinter.printText(`${customerAddress}\n`, {});
        }
        if (customerGstin) {
          await BluetoothEscposPrinter.printText(`GSTIN : ${customerGstin}\n`, {});
        }
        if (customerState) {
          await BluetoothEscposPrinter.printText(`State : ${customerState}\n`, {});
        }
        if (invoice.customerNumber) {
          await BluetoothEscposPrinter.printText(`Phone : ${invoice.customerNumber}\n`, {});
        }
      } else if (invoice.customerNumber) {
        await BluetoothEscposPrinter.printText(
          `Customer Number : ${invoice.customerNumber}\n`,
          {},
        );
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

      // Group GST components by full tax rate so taxable value prints once
      // for CGST + SGST, or once for IGST.
      const gstGroups = new Map();
      for (const gst of gstList || []) {
        const gstType = String(gst?.gstType || '').toUpperCase();
        const componentRate = Number(gst?.gstPercentage) || 0;
        const isIgst = gstType === 'IGST';
        const totalRate = isIgst ? componentRate : componentRate * 2;
        const key = `${totalRate}:${isIgst ? 'IGST' : 'GST'}`;
        const group = gstGroups.get(key) || {
          totalRate,
          isIgst,
          taxableAmount: 0,
          hasTaxableAmount: false,
          taxLines: [],
        };

        // calculateInvoiceData supplies the same taxable amount on CGST and
        // SGST rows, so only take it from one component.
        if ((isIgst || gstType === 'CGST') && !group.hasTaxableAmount) {
          group.taxableAmount =
            gst?.rate ?? gst?.taxableAmount ?? gst?.taxableValue ?? 0;
          group.hasTaxableAmount = true;
        }
        group.taxLines.push({
          label: `${gstType} ${componentRate}%`,
          amount: gst?.gstAmount,
        });
        gstGroups.set(key, group);
      }

      if (gstGroups.size > 0) {
        await BluetoothEscposPrinter.printText(dashLine, {});
        for (const group of [...gstGroups.values()].sort(
          (a, b) => a.totalRate - b.totalRate,
        )) {
          await BluetoothEscposPrinter.printColumn(
            summaryWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [`${group.totalRate.toFixed(2)}% GST Items`, ''],
            {},
          );
          await BluetoothEscposPrinter.printColumn(
            summaryWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ['Taxable Value', this.cleanAmount(group.taxableAmount)],
            {},
          );
          for (const taxLine of group.taxLines) {
            await BluetoothEscposPrinter.printColumn(
              summaryWidths,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              [taxLine.label, this.cleanAmount(taxLine.amount)],
              {},
            );
          }
          await BluetoothEscposPrinter.printText('\n', {});
        }
      }

      await BluetoothEscposPrinter.printColumn(
        summaryWidths,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ['Total Amount :', this.cleanAmount(breakdownTotalAmount)],
        {},
      );

      await BluetoothEscposPrinter.printColumn(
        summaryWidths,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        [
          'Round Off :',
            `${roundOffAmount > 0 ? '+' : roundOffAmount < 0 ? '-' : ''}${this.cleanAmount(Math.abs(roundOffAmount || 0))}`,
        ],
        {},
      );

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
        ['Final Amount :', this.cleanAmount(invoice.totalAmount)],
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
