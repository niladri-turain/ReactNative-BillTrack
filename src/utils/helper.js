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

// Calculate invoice values in integer paise, using the same per-item GST
// rounding as the customer invoice page.
const calculateInvoiceData = (items = [], totalDiscount = 0, authoritativeTotal = null) => {
  const toPaise = value => Math.round(Number(value || 0) * 100);
  const fromPaise = value => value / 100;
  const sourceItems = Array.isArray(items) ? items : [];
  const subtotalPaise = sourceItems.reduce((sum, item) => {
    const price = Number(item?.originalPrice ?? item?.rate ?? 0);
    const quantity = Number(item?.quantity || 0);
    return sum + Math.round(price * quantity * 100);
  }, 0);
  const hasItemDiscounts = sourceItems.some(
    item => item?.discount !== undefined && item?.discount !== null && item?.discount !== '',
  );
  const invoiceDiscountPaise = toPaise(totalDiscount);
  const grossPaiseList = sourceItems.map(item =>
    Math.round(Number(item?.originalPrice ?? item?.rate ?? 0) * Number(item?.quantity || 0) * 100),
  );
  const allocatedDiscounts = grossPaiseList.map((gross, index) => {
    if (hasItemDiscounts) return toPaise(sourceItems[index]?.discount);
    if (!subtotalPaise) return 0;
    return Math.floor((invoiceDiscountPaise * gross) / subtotalPaise);
  });
  // Assign any leftover paisa deterministically so item discounts equal the invoice discount.
  if (!hasItemDiscounts && subtotalPaise > 0) {
    let remaining = invoiceDiscountPaise - allocatedDiscounts.reduce((sum, amount) => sum + amount, 0);
    for (let index = 0; remaining > 0 && index < allocatedDiscounts.length; index += 1) {
      if (grossPaiseList[index] > 0) {
        allocatedDiscounts[index] += 1;
        remaining -= 1;
        if (index === allocatedDiscounts.length - 1 && remaining > 0) index = -1;
      }
    }
  }

  const calculatedItems = [];
  const groupMap = new Map();
  let totalQuantity = 0;
  let nonGstTotalPaise = 0;

  sourceItems.forEach((item, index) => {
    const originalPrice = Number(item?.originalPrice ?? item?.rate ?? 0);
    const quantity = Number(item?.quantity || 0);
    const rate = Number(item?.gstPercentage || 0);
    const isIgst = String(item?.gstType || '').toLowerCase() === 'igst';
    const lineTotalPaise = grossPaiseList[index] - allocatedDiscounts[index];
    const taxPaise = rate > 0
      ? Math.round((lineTotalPaise * rate) / (100 + rate))
      : 0;
    const taxablePaise = lineTotalPaise - taxPaise;
    const halfTaxPaise = Math.round(taxPaise / 2);
    totalQuantity += quantity;

    if (rate > 0) {
      const key = `${rate}:${isIgst ? 'igst' : 'cgst'}`;
      const group = groupMap.get(key) || {
        rate,
        isIgst,
        taxablePaise: 0,
        taxPaise: 0,
        halfTaxPaise: 0,
      };
      group.taxablePaise += taxablePaise;
      group.taxPaise += taxPaise;
      if (!isIgst) group.halfTaxPaise += halfTaxPaise;
      groupMap.set(key, group);
    } else {
      nonGstTotalPaise += lineTotalPaise;
    }

    const discountedLineTotal = fromPaise(lineTotalPaise);
    calculatedItems.push({
      ...item,
      productName: item.productName || item.name,
      quantity,
      rate: rate > 0 && quantity ? fromPaise(taxablePaise) / quantity : discountedLineTotal / (quantity || 1),
      originalPrice,
      discountedRate: discountedLineTotal / (quantity || 1),
      gstPercentage: rate,
    });
  });

  const groups = [...groupMap.values()].sort((a, b) =>
    a.rate - b.rate || Number(a.isIgst) - Number(b.isIgst),
  );
  const gstListCalculate = groups.flatMap(group => {
    const taxable = fromPaise(group.taxablePaise);
    if (group.isIgst) {
      return [{
        gstType: 'IGST',
        gstPercentage: group.rate,
        gstAmount: fromPaise(group.taxPaise),
        rate: taxable,
      }];
    }
    return [
      {
        gstType: 'CGST',
        gstPercentage: group.rate / 2,
        gstAmount: fromPaise(group.halfTaxPaise),
        rate: taxable,
      },
      {
        gstType: 'SGST',
        gstPercentage: group.rate / 2,
        gstAmount: fromPaise(group.halfTaxPaise),
        rate: taxable,
      },
    ];
  });

  // The invoice-level discount is used for the net total, matching the web
  // invoice. Per-item discounts are used only to calculate each GST line.
  const netTotalPaise = subtotalPaise - invoiceDiscountPaise;
  const payableTotalPaise = authoritativeTotal !== null &&
    authoritativeTotal !== undefined && authoritativeTotal !== '' &&
    Number.isFinite(Number(authoritativeTotal))
    ? toPaise(authoritativeTotal)
    : netTotalPaise;
  const hasOnlyGstItems = sourceItems.length > 0 && nonGstTotalPaise === 0 &&
    sourceItems.every(item => Number(item?.gstPercentage || 0) > 0);

  let breakdownTotalPaise = netTotalPaise;
  let roundOffPaise = 0;
  if (hasOnlyGstItems && groups.length > 0) {
    const displayedTaxPaise = groups.reduce(
      (sum, group) => sum + (group.isIgst ? group.taxPaise : group.halfTaxPaise * 2),
      0,
    );
    const cgstTaxablePaise = groups
      .filter(group => !group.isIgst)
      .reduce((sum, group) => sum + group.taxablePaise, 0);
    const allTaxablePaise = groups.reduce((sum, group) => sum + group.taxablePaise, 0);
    breakdownTotalPaise = allTaxablePaise + displayedTaxPaise;
    const differencePaise = payableTotalPaise - cgstTaxablePaise - displayedTaxPaise;
    const maxRoundOffPaise = 50;
    if (
      Math.abs(payableTotalPaise - netTotalPaise) <= maxRoundOffPaise &&
      Math.abs(differencePaise) <= maxRoundOffPaise
    ) {
      roundOffPaise = differencePaise;
    }
  }

  return {
    items: calculatedItems,
    gstListCalculate,
    totalQuantity,
    subTotalAmount: fromPaise(subtotalPaise),
    netTotal: fromPaise(netTotalPaise),
    breakdownTotalAmount: fromPaise(breakdownTotalPaise),
    roundOffAmount: fromPaise(roundOffPaise),
  };
};

const getInterStateTaxStatus = (
  invoice = {},
  sellerStateId = null,
  customerStateId = null,
) => {
  const taxType = String(invoice?.taxType || '').toUpperCase();
  if (taxType.startsWith('INTER') || taxType === 'IGST') return true;
  if (taxType.startsWith('INTRA') || taxType === 'CGST/SGST') return false;

  const sellerStateCode =
    invoice?.sellerStateCode || invoice?.businessStateCode;
  const customerStateCode =
    invoice?.placeOfSupplyStateCode || invoice?.customerStateCode;
  if (sellerStateCode && customerStateCode) {
    return String(sellerStateCode) !== String(customerStateCode);
  }

  const invoiceSellerStateId = invoice?.sellerStateId ?? sellerStateId;
  const invoiceCustomerStateId =
    invoice?.customerStateId ?? invoice?.placeOfSupplyStateId ?? customerStateId;
  if (invoiceSellerStateId != null && invoiceCustomerStateId != null) {
    return String(invoiceSellerStateId) !== String(invoiceCustomerStateId);
  }
  return null;
};

const normalizeInvoiceItemsTaxType = (
  items = [],
  invoice = {},
  sellerStateId = null,
  customerStateId = null,
) => {
  if (!Array.isArray(items)) return [];
  const isInterState = getInterStateTaxStatus(
    invoice,
    sellerStateId,
    customerStateId,
  );
  if (isInterState === null) return items;
  return items.map(item => {
    if (Number(item?.gstPercentage || item?.gstRate || item?.gst || 0) <= 0) {
      return item;
    }
    return {...item, gstType: isInterState ? 'IGST' : 'CGST/SGST'};
  });
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
  getInterStateTaxStatus,
  normalizeInvoiceItemsTaxType,
  generateInvoices,
};
