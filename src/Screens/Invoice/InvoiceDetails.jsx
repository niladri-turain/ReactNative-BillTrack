import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import React, {useEffect, useMemo, useState} from 'react';
import {Layout} from '../Layout';
import {DottedDivider, SecondaryHeader} from '../../Components';
import {fonts} from '../../utils/fonts';
import {useBusiness, useUser} from '../../Contexts/AuthContext';
import {useRoute} from '@react-navigation/native';
import {invoiceService} from '../../Services/InvoiceService';
import {API_URL} from '../../utils/config';
import {icon, font, gap, margin} from '../../utils/responsive';
import {
  calculateInvoiceData,
  formatDate,
  formatTime12Hour,
} from '../../utils/helper';
import {colors} from '../../utils/colors';

function convertTo12Hour(datetime) {
  const date = new Date(datetime.replace(' ', 'T'));

  let hours = date.getHours();
  const minutes = date.getMinutes();

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12

  const mins = minutes < 10 ? '0' + minutes : minutes;

  return `${hours}:${mins} ${ampm}`;
}

const InvoiceDetails = () => {
  // ROUTE - NAVIGATION
  const route = useRoute();
  const {invoice} = route.params;
  const business = useBusiness();
  const _userName = useUser('name');
  const userName = _userName || business?.name;
  console.log("business", business);

  // STATE VARIABLES
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [gstList, setGstList] = useState([]);
  const [groupedGstList, setGroupedGstList] = useState([]);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [subTotalAmount, setSubTotalAmount] = useState(0);

  // LOADING STATE
  const [isLoading, setIsLoading] = useState(true);

  const {width} = useWindowDimensions();

  const sizes = useMemo(() => {
    const logoHeight = width * 0.065;
    const logoWidth = width * 0.22;

    // Font sizes
    const invoiceTitleFontSize = font(14);
    const invoiceItemFontSize = font(14);
    const thankYouTextFontSize = font(15);

    // Paddings
    const containerPaddingBottom = width * 0.026; // 10
    const topContainerPaddingVertical = width * 0.08; // 30
    const secondContainerPaddingHorizontal = width * 0.042; // 16
    const itemContainerPaddingHorizontal = width * 0.042; // 16

    // Margins
    const containerMarginTop = width * 0.053; // 20
    const itemContainerMarginVertical = width * 0.013; // 5

    // Spacing / gaps
    const topContainerGap = width * 0.018; // 7
    const subSecondContainerGap = width * 0.026; // 10

    return {
      logoHeight,
      logoWidth,
      invoiceTitleFontSize,
      invoiceItemFontSize,
      thankYouTextFontSize,
      containerPaddingBottom,
      topContainerPaddingVertical,
      secondContainerPaddingHorizontal,
      itemContainerPaddingHorizontal,
      containerMarginTop,
      itemContainerMarginVertical,
      topContainerGap,
      subSecondContainerGap,
    };
  }, [width]);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await invoiceService.getInvoiceItems(invoice.id);
      if (data?.status) {
        // Call the calculation function
        const result = calculateInvoiceData(data?.items);
        // Update all states with the returned values
        const sortedItems = [...result.items].sort((a, b) => {
          const gstA = parseFloat(a.gstPercentage) || 0;
          const gstB = parseFloat(b.gstPercentage) || 0;
          return gstA - gstB;
        });
        setTotalQuantity(result.totalQuantity);
        setSubTotalAmount(result.subTotalAmount);
        setInvoiceItems(sortedItems);
        const grouped = Object.values(
          result.gstListCalculate.reduce((acc, item) => {
            const key = item.gstPercentage;

            if (!acc[key]) {
              acc[key] = {
                gstPercentage: key,
                items: [],
                totalRate: 0,
                totalGstAmount: 0,
              };
            }

            acc[key].items.push(item);

            // GST amount should sum normally
            acc[key].totalGstAmount += item.gstAmount;

            // Rate should count only once per product
            if (item.gstType === 'CGST') {
              acc[key].totalRate += item.rate;
            }

            return acc;
          }, {}),
        );
        const sortedGrouped = grouped.sort(
          (a, b) => a.gstPercentage - b.gstPercentage,
        );

        setGroupedGstList(sortedGrouped);
        console.log('invoiceItems ' + JSON.stringify(result.items));
        console.log('grouped ' + JSON.stringify(grouped));
      }
    } catch (error) {
      // Handle error
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 200);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [invoice]);

  const hasAnyHsn = invoiceItems.some(item => item?.hsnCode || item?.hsn || (item?.gstPercentage && parseFloat(item?.gstPercentage) > 0));

  return (
    <Layout>
      <SecondaryHeader
        title="Invoice Details"
        isNotification={false}
        isQuestion={false}
        isSearch={false}
      />
      {isLoading ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            gap: 30,
          }}>
          <ActivityIndicator color={colors.primary} size={'large'} />
          <Text
            style={{
              color: colors.border,
              fontSize: font(14),
              fontFamily: fonts.inMedium,
            }}>
            Loading Invoice Details
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{paddingBottom: 20}}>
          <View
            style={[
              styles.container,
              {
                paddingBottom: sizes.containerPaddingBottom,
                marginTop: sizes.containerMarginTop,
              },
            ]}>
            <View
              style={[
                styles.topContainer,
                {
                  paddingVertical: sizes.topContainerPaddingVertical,
                  gap: sizes.topContainerGap,
                },
              ]}>
              <Image
                source={{uri: `${API_URL}files/logo/${business?.logoUrl}`}}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={[styles.businessText, {fontSize: font(20)}]}>
                {userName}
              </Text>
              {business?.phone && (
                <View style={styles.topKeyValueStyle}>
                  <Text style={[styles.keyText, {fontSize: font(14)}]}>
                    Phone Number:{' '}
                  </Text>
                  <Text style={[styles.valueText, {fontSize: font(14)}]}>
                    {business?.phone}
                  </Text>
                </View>
              )}
              <View style={styles.topKeyValueStyle}>
                <Text style={[styles.keyText, {fontSize: font(14)}]}>
                  Address:{' '}
                </Text>
                <Text
                  style={[
                    styles.valueText,
                    {width: '50%', fontSize: font(14)},
                  ]}>
                  {business?.street}, {business?.city}, {business?.state},{' '}
                  {business?.pinCode}
                </Text>
              </View>
              {business?.gstNumber && (
                <View style={styles.topKeyValueStyle}>
                  <Text style={[styles.keyText, {fontSize: font(14)}]}>
                    GST NO :{' '}
                  </Text>
                  <Text style={[styles.valueText, {fontSize: font(14)}]}>
                    {business?.gstNumber}
                  </Text>
                </View>
              )}
            </View>
            
            <DottedDivider borderWidth={0.8} />
            
            <View
              style={[
                styles.secondContainer,
                {paddingHorizontal: sizes.secondContainerPaddingHorizontal},
              ]}>
              <View
                style={[
                  styles.subSecondContainer,
                  {gap: sizes.subSecondContainerGap},
                ]}>
                <Text style={[styles.invoiceText, {fontSize: font(14)}]}>
                  Invoice No : {invoice.invoiceNumber}{' '}
                </Text>
                <Text style={[styles.invoiceText, {fontSize: font(14)}]}>
                  Date : {formatDate(invoice?.createdAt)}
                </Text>
              </View>
              <View style={styles.subSecondContainer}>
                <Text style={[styles.invoiceText, {fontSize: font(14)}]} />
                <Text style={[styles.invoiceText, {fontSize: font(14)}]}>
                  Time : {convertTo12Hour(invoice?.createdAt)}
                </Text>
              </View>
            </View>
            
            {invoice?.customerNumber && <DottedDivider borderWidth={0.8} />}
            
            <View
              style={[
                styles.secondContainer,
                {paddingHorizontal: sizes.secondContainerPaddingHorizontal},
              ]}>
              {invoice.customerNumber && (
                <View style={styles.subSecondContainer}>
                  <Text style={[styles.invoiceText, {fontSize: font(14)}]}>
                    Customer : +91 {invoice?.customerNumber}
                  </Text>
                </View>
              )}
            </View>
            
            <DottedDivider borderWidth={0.8} />
            
            {/* COLUMN HEADERS */}
            <View style={styles.itemContainer}>
              <View style={{width: '40%'}}>
                <Text style={[styles.invoiceTitle, {fontSize: sizes.invoiceTitleFontSize}]}>
                  Item
                </Text>
                {hasAnyHsn && (
                  <Text style={[styles.invoiceTitle, {fontSize: 12, marginTop: 2}]}>
                    HSN (GST)
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.invoiceTitle,
                  {
                    width: '20%',
                    textAlign: 'center',
                    fontSize: sizes.invoiceTitleFontSize,
                  },
                ]}>
                Qty
              </Text>
              <Text
                style={[
                  styles.invoiceTitle,
                  {
                    width: '20%',
                    textAlign: 'right',
                    fontSize: sizes.invoiceTitleFontSize,
                  },
                ]}>
                Price
              </Text>
              <Text
                style={[
                  styles.invoiceTitle,
                  {
                    width: '20%',
                    textAlign: 'right',
                    fontSize: sizes.invoiceTitleFontSize,
                  },
                ]}>
                Amount
              </Text>
            </View>
            
            <DottedDivider borderWidth={0.8} />
            
            {/* ITEMS LIST LOOP */}
            {invoiceItems.map((item, index) => {
              const hsnCode = item?.hsnCode || item?.hsn || '';
              const gstRate = item?.gstPercentage && parseFloat(item.gstPercentage) > 0 
                ? `${parseFloat(item.gstPercentage)}%` 
                : '';

              return (
                <View style={styles.itemContainer} key={index + '_item'}>
                  <View style={{width: '40%'}}>
                    <Text style={[styles.invoiceItem, {fontSize: sizes.invoiceItemFontSize}]}>
                      {item.name}
                    </Text>
                    {hasAnyHsn && (hsnCode || gstRate) && (
                      <Text style={[styles.invoiceHsnGstText, {fontSize: font(12)}]}>
                        {`${hsnCode}${gstRate ? `(${gstRate})` : ''}`}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.invoiceItem,
                      {
                        width: '20%',
                        textAlign: 'center',
                        fontSize: sizes.invoiceItemFontSize,
                      },
                    ]}>
                    {item.quantity}
                  </Text>
                  <Text
                    style={[
                      styles.invoiceItem,
                      {
                        width: '20%',
                        textAlign: 'right',
                        fontSize: sizes.invoiceItemFontSize,
                      },
                    ]}>
                    ₹{Number(item?.originalPrice).toFixed(2)}
                  </Text>
                  <Text
                    style={[
                      styles.invoiceTitle,
                      {
                        width: '20%',
                        textAlign: 'right',
                        fontSize: sizes.invoiceTitleFontSize,
                      },
                    ]}>
                    ₹{(Number(item.originalPrice) * Number(item.quantity)).toFixed(2)}
                  </Text>
                </View>
              );
            })}
            
            <DottedDivider borderWidth={0.8} />
            
            <View
              style={[
                styles.secondContainer,
                {paddingHorizontal: sizes.secondContainerPaddingHorizontal},
              ]}>
              <View style={styles.subSecondContainer}>
                <Text style={[styles.invoiceText, {fontSize: font(14)}]}>
                  Total Quantity : {totalQuantity}
                </Text>
              </View>
              <View style={styles.subSecondContainer}>
                <Text style={[styles.invoiceText, {fontSize: font(14)}]}>
                  Sub Total : ₹{subTotalAmount.toFixed(2)}
                </Text>
              </View>
            </View>
            
            {invoice?.discountAmount > 0 && (
              <View
                style={[
                  styles.secondContainer,
                  {paddingHorizontal: sizes.secondContainerPaddingHorizontal},
                ]}>
                <View style={styles.subSecondContainer}>
                  <Text style={[styles.invoiceText, {fontSize: font(14)}]}>
                    Total Discount:
                  </Text>
                </View>
                <View style={styles.subSecondContainer}>
                  <Text style={[styles.invoiceText, {fontSize: font(14)}]}>
                    ₹{invoice?.discountAmount}
                  </Text>
                </View>
              </View>
            )}
            
            <DottedDivider borderWidth={0.8} />

            {/* GST BREAKDOWN SECTION */}
            {groupedGstList.map((item, index) => (
              <View style={{marginBottom: 10}} key={index + 'grouped_gst_parent'}>
                <View
                  style={[
                    styles.secondContainerForGSTPercentage,
                    {paddingHorizontal: sizes.secondContainerPaddingHorizontal},
                  ]}>
                  <View style={styles.subSecondContainer}>
                    <Text style={[styles.invoiceText, {fontSize: font(14)}]}>
                      {(Number(item.gstPercentage) * 2).toFixed(2)}% GST Items
                    </Text>
                  </View>
                  <View style={styles.subSecondContainer}>
                    <Text style={[styles.invoiceText, {fontSize: font(14)}]} />
                  </View>
                </View>
                <View
                  style={[
                    styles.secondContainer,
                    {
                      paddingHorizontal: sizes.secondContainerPaddingHorizontal,
                      marginTop: margin(-1),
                    },
                  ]}>
                  <View style={styles.subSecondContainer}>
                    <Text style={[styles.invoiceText, {fontSize: font(14)}]}>
                      Taxable Value
                    </Text>
                  </View>
                  <View style={styles.subSecondContainer}>
                    <Text style={[styles.invoiceText, {fontSize: font(14)}]}>
                      {item?.totalRate.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={{marginTop: margin(2)}}>
                  {item?.items.map((gstitem, i) => (
                    <View
                      key={i + 'gst_list'}
                      style={[
                        styles.secondContainer,
                        {
                          paddingHorizontal: sizes.secondContainerPaddingHorizontal,
                          marginTop: margin(-2),
                        },
                      ]}>
                      <View style={styles.subSecondContainer}>
                        <Text style={[styles.gstText, {fontSize: font(14)}]}>
                          {gstitem?.gstType} {gstitem?.gstPercentage}%
                        </Text>
                      </View>
                      <View style={styles.subSecondContainer}>
                        <Text style={[styles.gstText, {fontSize: font(14)}]}>
                          {gstitem?.gstAmount.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <DottedDivider borderWidth={0.8} />
            
            <View
              style={[
                styles.secondContainer,
                {paddingHorizontal: sizes.secondContainerPaddingHorizontal},
              ]}>
              <View style={styles.subSecondContainer}>
                <Text style={[styles.invoiceText, {fontSize: 15}]}>
                  Payment : {new String(invoice?.paymentMode).toUpperCase()}
                </Text>
              </View>
              <View style={styles.subSecondContainer}>
                <Text style={[styles.invoiceText, {fontSize: font(14)}]}>
                  Total Amount : ₹{invoice.totalAmount}
                </Text>
              </View>
            </View>
            
            <DottedDivider borderWidth={0.8} />
            
            <Text style={[styles.thankYouText, {fontSize: sizes.thankYouText}]}>
              Thank You & Visit Again
            </Text>
          </View>
        </ScrollView>
      )}
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  topContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: icon(100),
    height: icon(100),
  },
  businessText: {
    fontFamily: fonts.onBold,
    color: '#000',
  },
  topKeyValueStyle: {
    flexDirection: 'row',
    gap: 5,
  },
  keyText: {
    fontFamily: fonts.onSemiBold,
    color: '#000',
  },
  valueText: {
    fontFamily: fonts.onMedium,
    color: '#000',
  },
  secondContainer: {
    marginVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondContainerForGSTPercentage: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subSecondContainer: {
    // Gap custom handle korle ekhane korte paren
  },
  invoiceText: {
    fontFamily: fonts.inSemiBold,
    color: '#000000',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // text-wrapping er jonno alignment flex-start rakha hoyeche
    paddingHorizontal: 16,
    marginVertical: 5,
  },
  invoiceTitle: {
    fontFamily: fonts.inBold,
    color: '#000000',
  },
  invoiceItem: {
    fontFamily: fonts.inMedium,
    color: '#000000',
  },
  invoiceHsnGstText: {
    fontFamily: fonts.inMedium,
    color: '#555555',
    marginTop: 2,
  },
  thankYouText: {
    fontFamily: fonts.inBold,
    color: '#000000',
    textAlign: 'center',
    marginVertical: 10,
  },
  gstText: {
    fontFamily: fonts.inMedium,
    color: '#000000',
  },
});

export default InvoiceDetails;