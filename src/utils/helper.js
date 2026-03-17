import {PermissionsAndroid, Platform} from 'react-native';

const requestPermission = async () => {
  if (Platform.OS === 'android') {
    const permission =
      Platform.Version >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
    const granted = await PermissionsAndroid.request(permission);

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  return true;
};

function formatDate(isoString) {
  const date = new Date(isoString);

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day} ${year}`;
}

function formatTime12Hour(isoString) {
  const date = new Date(isoString);

  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();

  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes.toString().padStart(2, '0');

  return `${hours.toString().padStart(2, '0')}:${minutesStr} ${period}`;
}

// responsible to calculate the invoice data
const calculateInvoiceData = items => {
  console.log(JSON.stringify(items));
  const calculatedItems = [];
  const gstListCalculate = [];
  let totalQuantity = 0;
  let subTotalAmount = 0;

  items.forEach(item => {
    // const rate = parseFloat(item?.rate);
    const rate = parseFloat(item?.originalPrice);
    let actualRate;
    const quantity = Number(item?.quantity);
    totalQuantity += quantity;

    if (item?.gstType !== null && item?.gstPercentage !== 0) {
      const gstPercentage = parseFloat(item?.gstPercentage);

      // Correct formula: actualRate = rate / (1 + gstPercentage/100)
      actualRate = rate / (1 + gstPercentage / 100);

      // GST amount is the difference
      const gstAmount = rate - actualRate;

      // Helper function to find or create GST entry
      const addOrUpdateGst = (type, percentage, amount, baseRate) => {
        const existing = gstListCalculate.find(
          g => g.gstType === type && g.gstPercentage === percentage,
        );

        if (existing) {
          existing.gstAmount += amount;
          existing.rate += baseRate;
        } else {
          gstListCalculate.push({
            gstType: type,
            gstPercentage: percentage,
            gstAmount: amount,
            rate: baseRate,
          });
        }
      };

      // Add or update CGST
      addOrUpdateGst(
        'CGST',
        gstPercentage / 2,
        (gstAmount / 2) * quantity,
        actualRate * quantity,
      );

      // Add or update SGST
      addOrUpdateGst(
        'SGST',
        gstPercentage / 2,
        (gstAmount / 2) * quantity,
        actualRate * quantity,
      );
    } else {
      actualRate = rate;
    }

    // subTotalAmount += actualRate * Number(item?.quantity);
    subTotalAmount += Number(item?.originalPrice) * Number(item?.quantity);
    calculatedItems.push({
      name: item?.productName,
      quantity: item?.quantity,
      rate: actualRate,
      gstPercentage: item?.gstPercentage,
      originalPrice: item?.originalPrice,
    });
  });

  return {
    items: calculatedItems,
    gstListCalculate,
    totalQuantity,
    subTotalAmount,
  };
};

function generateInvoices(prefix = 'INV/', count = 1) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let startYear = year;
  if (month < 4) {
    startYear = year - 1;
  }

  const fy = String(startYear).slice(-2) + String(startYear + 1).slice(-2);
  const numberPart = String(count).padStart(5, '0');

  return `${prefix}${fy}${numberPart}`;
}

export {
  requestPermission,
  formatDate,
  formatTime12Hour,
  calculateInvoiceData,
  generateInvoices,
};
