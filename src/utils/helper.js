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
const calculateInvoiceData = (items, totalDiscount = 0) => {
  const calculatedItems = [];
  const gstListCalculate = [];
  let totalQuantity = 0;
  let subTotalAmount = 0;

  // 1. Subtotal calculation (before discount)
  const actualSubtotal = items.reduce(
    (acc, item) => acc + parseFloat(item?.originalPrice || item?.rate || 0) * Number(item?.quantity || 0),
    0,
  );

  items.forEach(item => {
    const originalPrice = parseFloat(item?.originalPrice || item?.rate || 0);
    const quantity = Number(item?.quantity || 0);
    totalQuantity += quantity;
    subTotalAmount += originalPrice * quantity;

    // 2 & 3. Distribute Discount Proportionally
    let discountedPricePerUnit = originalPrice;
    if (totalDiscount > 0 && actualSubtotal > 0 && quantity > 0) {
      const itemTotalOriginal = originalPrice * quantity;
      const itemProportionalDiscount = (totalDiscount * itemTotalOriginal) / actualSubtotal;
      discountedPricePerUnit = (itemTotalOriginal - itemProportionalDiscount) / quantity;
    }

    // 4. Calculate Taxable Value (Taxable = Discounted Price / (1 + GST%/100))
    let taxableRate = discountedPricePerUnit;
    const gstPercentage = parseFloat(item?.gstPercentage || 0);

    if (gstPercentage !== 0) {
      taxableRate = discountedPricePerUnit / (1 + gstPercentage / 100);
      const totalGstAmountForItem = (discountedPricePerUnit - taxableRate) * quantity;

      // 5. Calculate CGST/SGST
      const addOrUpdateGst = (type, percentage, amount, baseValue) => {
        const existing = gstListCalculate.find(
          g => g.gstType === type && g.gstPercentage === percentage,
        );
        if (existing) {
          existing.gstAmount += amount;
          existing.rate += baseValue;
        } else {
          gstListCalculate.push({
            gstType: type,
            gstPercentage: percentage,
            gstAmount: amount,
            rate: baseValue,
          });
        }
      };

      addOrUpdateGst('CGST', gstPercentage / 2, totalGstAmountForItem / 2, taxableRate * quantity);
      addOrUpdateGst('SGST', gstPercentage / 2, totalGstAmountForItem / 2, taxableRate * quantity);
    }

    calculatedItems.push({
      ...item,
      productName: item.productName || item.name,
      quantity: quantity,
      rate: taxableRate,
      originalPrice: originalPrice,
      discountedRate: discountedPricePerUnit,
      gstPercentage: gstPercentage
    });
  });

  // Use a precise rounding function to 2 decimal places
  const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

  const roundedSubTotal = round2(subTotalAmount);
  const netTotal = round2(subTotalAmount - totalDiscount);

  gstListCalculate.forEach(g => {
    g.gstAmount = round2(g.gstAmount);
    g.rate = round2(g.rate);
  });

  return {
    items: calculatedItems,
    gstListCalculate,
    totalQuantity,
    subTotalAmount: roundedSubTotal,
    netTotal: netTotal,
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
