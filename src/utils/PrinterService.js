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

  async printInvoice(
    invoice,
    invoiceItems,
    gstList,
    totalQuantity,
    subTotalAmount,
    business,
    printerSize = '80',
  ) {
    try {
      const columnWidths = printerSize === '58' ? [12, 6, 6, 8] : [20, 8, 10, 10];
      const lineLength = printerSize === '58' ? 32 : 48;
      const dashLine = '-'.repeat(lineLength) + '\n';

      // Header
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.setBlob(0);
      await BluetoothEscposPrinter.printText(`${business?.name}\n`, {
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
      await BluetoothEscposPrinter.printText(`Invoice: ${invoice.invoiceNumber}\n`, {});
      await BluetoothEscposPrinter.printText(`Date: ${formatDate(invoice.createdAt)}\n`, {});
      await BluetoothEscposPrinter.printText(`Time: ${this.convertTo12Hour(invoice.createdAt)}\n`, {});
      if (invoice.customerNumber) {
        await BluetoothEscposPrinter.printText(`Customer: ${invoice.customerNumber}\n`, {});
      }
      await BluetoothEscposPrinter.printText(dashLine, {});

      // Table Header
      await BluetoothEscposPrinter.printColumn(
        columnWidths,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
        ['Item', 'Qty', 'Rate', 'Amt'],
        {}
      );
      await BluetoothEscposPrinter.printText(dashLine, {});

      // Items
      for (const item of invoiceItems) {
        const name = item.productName || item.name;
        const qty = item.quantity.toString();
        const rate = parseFloat(item.originalPrice).toFixed(2);
        const amount = (parseFloat(item.originalPrice) * parseInt(item.quantity)).toFixed(2);

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
          [name, qty, rate, amount],
          {}
        );
      }
      await BluetoothEscposPrinter.printText(dashLine, {});

      // Summary
      await BluetoothEscposPrinter.printColumn(
        [lineLength - 12, 12],
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        ['Total Qty:', totalQuantity.toString()],
        {}
      );
      await BluetoothEscposPrinter.printColumn(
        [lineLength - 12, 12],
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        ['Sub Total:', `Rs ${subTotalAmount.toFixed(2)}`],
        {}
      );

      if (parseFloat(invoice?.discountAmount) > 0) {
        await BluetoothEscposPrinter.printColumn(
          [lineLength - 12, 12],
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
          ['Discount:', `Rs -${parseFloat(invoice.discountAmount).toFixed(2)}`],
          {}
        );
      }

      // GST
      if (gstList && gstList.length > 0) {
        for (const gst of gstList) {
          await BluetoothEscposPrinter.printColumn(
            [lineLength - 12, 12],
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
            [`${gst.gstType} @${gst.gstPercentage}%`, `Rs ${gst.gstAmount.toFixed(2)}`],
            {}
          );
        }
      }

      await BluetoothEscposPrinter.printText(dashLine, {});
      await BluetoothEscposPrinter.setBlob(1);
      await BluetoothEscposPrinter.printColumn(
        [lineLength - 12, 12],
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        ['TOTAL AMOUNT:', `Rs ${invoice.totalAmount}`],
        {widthtimes: 1}
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
      Alert.alert('Print Error', 'Failed to print invoice.');
      return false;
    }
  }
}

const printerService = new PrinterService();
export default printerService;
