import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Layout} from '../Layout';
import {
  BillProductCard,
  CommonModal,
  CreateBillBottom,
  EmptyProductComponent,
  RadioInput,
  SecondaryHeader,
  SimpleTextInput,
} from '../../Components';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import Ionicons from '@react-native-vector-icons/ionicons';
import {fonts} from '../../utils/fonts';
import {validateIndianPhone} from '../../utils/validator';
import {colors} from '../../utils/colors';
import {
  font,
  gap,
  icon,
  isTabletDevice,
  margin,
  padding,
  widthResponsive,
} from '../../utils/responsive';
import {useProduct} from '../../Contexts/ProductContexts';
import ToastService from '../../Components/Toasts/ToastService';
import {invoiceService} from '../../Services/InvoiceService';
import {
  useAuth,
  useAuthToken,
  useBusiness,
  useSubscription,
} from '../../Contexts/AuthContext';
import {
  useAppSettings,
  useAppSettingsValue,
} from '../../Contexts/AppSettingContexts';
import {usePrinter} from '../../Contexts/PrinterContext';
import {calculateInvoiceData, generateInvoices} from '../../utils/helper';
import printerService from '../../utils/PrinterService';
import {sendToWhatsApp} from '../../utils/WhatsappShare';
import AntDesign from '@react-native-vector-icons/ant-design';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import Lucide from '@react-native-vector-icons/lucide';
import Animated, {
  FadeIn,
  FadeOut,
  interpolateColor,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {useInvoice} from '../../Contexts/InvoiceContext';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';

const {width: screenWidth} = Dimensions.get('window');
const NUM_COLUMNS = isTabletDevice ? 4 : 3;
const HORIZONTAL_PADDING = 16;
const GAP_BETWEEN_ITEMS = 10;

const ITEM_WIDTH =
  (screenWidth -
    HORIZONTAL_PADDING * 2 -
    GAP_BETWEEN_ITEMS * (NUM_COLUMNS - 1)) /
  NUM_COLUMNS;

const PAYMENT_OPTIONS = ['cash', 'card', 'upi'];

const CreateBill = () => {
  const inset = useSafeAreaInsets();
  const addInvoices = useInvoice('addInvoice');
  const {printer} = usePrinter();
  const business = useBusiness();
  const {updateNumberOfInvoices} = useAuth();
  const {getByKey} = useAppSettings();
  const token = useAuthToken();
  const {Products, resetProductCount} = useProduct();
  const [quantity, setQuantity] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [discount, setDiscount] = useState(0);

  const [isDiscountOpen, setIsDiscountOpen] = useState(false);

  const discountAnim = useSharedValue(0);

  // Sync shared value for color/border animation
  useEffect(() => {
    discountAnim.value = withSpring(isDiscountOpen ? 1 : 0, {
      damping: 15,
      stiffness: 100,
    });
  }, [isDiscountOpen]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        restartClickOfHeader();
      };
    }, []),
  );

  const floatingButtonAnimStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        discountAnim.value,
        [0, 1],
        [colors.sucess, '#ffffff'],
      ),
      // Animate border width smoothly
      borderWidth: withSpring(isDiscountOpen ? 2 : 0), // Reduced thickness for cleaner look
      borderColor: colors.border,
      // Removed 'transform: scale' to prevent text distortion
      // Removed 'width' to let Layout Animation handle it automatically
    };
  });

  const sentWhatAppEnabled = useAppSettingsValue(
    'SEND_WHATSAPP_BILL_ON_CREATE_BILL',
  );
  const isPremiumPlanAndActive = useSubscription('isPremiumPlanAndActive');

  const product = Products;

  // STATE VARIABLES
  const [phoneNumber, setPhoneNumber] = useState('');

  // LOADING STATE
  const [isPrintLoading, setIsPrintLoading] = useState(false);
  const [isSendLoading, setIsSendLoading] = useState(false);

  // BOTTOMSHEET
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['30%'], []);

  const handleCloseBottomSheet = useCallback(() => {
    bottomSheetRef.current?.close();
    Keyboard.dismiss();
  }, []);
  const handleOpenBottomSheet = useCallback(() => {
    bottomSheetRef.current?.expand();
    Keyboard.dismiss();
  });

  const renderBackdrop = useMemo(
    () => props =>
      (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.8}
          pressBehavior={'none'}
          onPress={() => {
            Keyboard.dismiss();
          }}
        />
      ),
    [],
  );

  const handleSave = () => {
    if (!quantity) {
      ToastService.show({
        message: 'Please Add Products',
        type: 'error',
        position: 'top',
      });
      return;
    }
    handleOpenBottomSheet();
  };

  const updateInvoiceNumber = async numberOfInvoices => {
    const safeNumber = Number(numberOfInvoices) + 1;
    await updateNumberOfInvoices(safeNumber);
  };

  const getBusinessInvoiceNumber = async () => {
    try {
      const safeNumber = Number(business?.numberOfInvoices);
      if (Number.isFinite(safeNumber)) {
        return safeNumber;
      } else {
        const data = await invoiceService.getInvoiceCount(token, business?.id);
        if (data?.status) {
          return Number(data?.count) + 1;
        }
        return 1;
      }
    } catch (error) {
      return 1;
    }
  };

  const printData = async () => {
    if (phoneNumber && !validateIndianPhone(phoneNumber)) {
      ToastService.show({
        message: 'Please enter a valid phone number',
        type: 'error',
        position: 'top',
      });
      return;
    }
    try {
      setIsPrintLoading(true);
      const selectedItems = product
        .filter(item => item.count)
        .map(item => {
          const hasHSN =
            item?.hsn &&
            typeof item.hsn === 'object' &&
            Object.keys(item.hsn).length > 0;

          return {
            productName: item?.name,
            quantity: item?.count,
            rate: Number(item?.price).toFixed(2),
            gstType: hasHSN ? 'cgst/sgst' : null,
            gstPercentage: hasHSN
              ? (
                  Number(item.hsn?.cGst || 0) + Number(item.hsn?.sGst || 0)
                ).toFixed(2)
              : null,
          };
        });

      const numberOfInvoices = await getBusinessInvoiceNumber();

      const invoiceNo = generateInvoices(business?.prefix, numberOfInvoices);
      const payload = {
        token,
        items: selectedItems,
        paymentMode: paymentMethod,
        customerNumber: phoneNumber,
        discount,
        invoiceNumber: invoiceNo,
      };
      const data = await invoiceService.createInvoice(payload);
      if (data?.status) {
        addInvoices(data?.invoice);
        ToastService.show({
          message: 'Bill Created Successfully',
          type: 'success',
          position: 'top',
        });
        setPhoneNumber('');
        setDiscount(0);
        setQuantity(0);
        setTotalPrice(0);
        setIsDiscountOpen(false);
        resetProductCount();
        handleCloseBottomSheet();
        const printOnCreateBill = getByKey('PRINT_ON_CREATE_BILL');
        if (printOnCreateBill && isPremiumPlanAndActive) {
          const invoice = data?.invoice;
          const invoiceItems = await invoiceService.getInvoiceItems(
            invoice?.id,
          );
          const {gstListCalculate, items, subTotalAmount, totalQuantity} =
            calculateInvoiceData(invoiceItems?.items);
          await printerService.printInvoice(
            printer,
            invoice,
            items,
            gstListCalculate,
            totalQuantity,
            subTotalAmount,
            business,
          );
        }
        await updateInvoiceNumber(numberOfInvoices);
      }
    } catch (error) {
    } finally {
      setIsPrintLoading(false);
    }
  };

  const sentData = async () => {
    if (!phoneNumber || !validateIndianPhone(phoneNumber)) {
      ToastService.show({
        message: 'Enter a valid phone number',
        type: 'error',
        position: 'top',
      });
      return;
    }
    try {
      setIsSendLoading(true);
      const selectedItems = product
        .filter(item => item.count)
        .map(item => {
          const hasHSN =
            item?.hsn &&
            typeof item.hsn === 'object' &&
            Object.keys(item.hsn).length > 0;

          return {
            productName: item?.name,
            quantity: item?.count,
            rate: Number(item?.price).toFixed(2),
            gstType: hasHSN ? 'cgst/sgst' : null,
            gstPercentage: hasHSN
              ? (
                  Number(item.hsn?.cGst || 0) + Number(item.hsn?.sGst || 0)
                ).toFixed(2)
              : null,
          };
        });

      const numberOfInvoices = await getBusinessInvoiceNumber();

      const invoiceNo = generateInvoices(business?.prefix, numberOfInvoices);
      const payload = {
        token,
        customerNumber: phoneNumber,
        items: selectedItems,
        paymentMode: paymentMethod,
        discount,
        invoiceNumber: invoiceNo,
      };

      const data = await invoiceService.createInvoice({
        token,
        customerNumber: phoneNumber,
        items: selectedItems,
        paymentMode: paymentMethod,
        discount,
        invoiceNumber: invoiceNo,
      });
      if (data?.status) {
        addInvoices(data?.invoice);
        ToastService.show({
          message: 'Bill Created Successfully',
          type: 'success',
          position: 'top',
        });
        setPhoneNumber('');
        setQuantity(0);
        setDiscount(0);
        setTotalPrice(0);
        setIsDiscountOpen(false);
        resetProductCount();
        handleCloseBottomSheet();
        await updateInvoiceNumber(numberOfInvoices);
        if (sentWhatAppEnabled) {
          await sendToWhatsApp({
            businessName: business?.name,
            invoiceNumber: data?.invoice?.invoiceNumber,
            createdAt: data?.invoice?.createdAt,
            customerNumber: data?.invoice?.customerNumber,
            totalAmount: data?.invoice?.totalAmount,
            paymentMode: data?.invoice?.paymentMode,
            businessId: business?.id,
          });
        }
      }
    } catch (error) {
    } finally {
      setIsSendLoading(false);
    }
  };

  const openPaymentModal = () => {
    setPaymentModalVisible(true);
  };
  const closePaymentModal = () => {
    setPaymentModalVisible(false);
    Keyboard.dismiss();
  };

  useEffect(() => {
    closePaymentModal();
  }, [paymentMethod]);

  const filteredProduct = useMemo(() => {
    if (!searchQuery.trim()) {
      return product;
    }

    return product.filter(productItem =>
      productItem.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, Products]);

  const restartClickOfHeader = () => {
    setPhoneNumber('');
    setQuantity(0);
    setDiscount(0);
    setTotalPrice(0);
    setIsDiscountOpen(false);
    resetProductCount();
    handleCloseBottomSheet();
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1, paddingBottom: inset.bottom}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <GestureHandlerRootView style={{flex: 1}}>
        <Layout>
          <SecondaryHeader
            title="Create Bill"
            query={searchQuery}
            isRestart={true}
            isQuestion={false}
            onchangeText={text => setSearchQuery(text)}
            handleRestartClick={restartClickOfHeader}
          />
          <FlatList
            keyboardShouldPersistTaps="handled"
            style={{flex: 1}}
            contentContainerStyle={styles.container}
            data={filteredProduct.filter(p => p.price)}
            keyExtractor={(_, index) => index + '_create_bill_item'}
            renderItem={({item}, index) => (
              <BillProductCard
                width={ITEM_WIDTH}
                item={item}
                setQuantity={setQuantity}
                setTotalPrice={setTotalPrice}
                key={index + '_bill_card'}
              />
            )}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={styles.columnWrapperStyle}
            ListEmptyComponent={() => <EmptyProductComponent />}
          />
          <CreateBillBottom
            totalQuanity={quantity}
            totalAmount={totalPrice - discount}
            saveButtonFunciton={handleSave}
            cashButtonFunction={openPaymentModal}
            paymentMode={paymentMethod}
          />
          {quantity > 0 && (
            <Animated.View
              // This automatically animates width/height changes smoothly
              layout={LinearTransition.springify().damping(15).stiffness(120)}
              style={[styles.floatingButton, floatingButtonAnimStyle]}>
              {isDiscountOpen ? (
                <Animated.View
                  key="discount-open" // Key is required for entering/exiting to work reliably
                  entering={FadeIn.duration(300)}
                  exiting={FadeOut.duration(200)}
                  style={styles.opendDiscountContainer}>
                  <Lucide
                    name="indian-rupee"
                    size={16}
                    color={colors.primary}
                  />
                  {/* Added autoFocus to improve UX */}
                  <TextInput
                    style={styles.floatingButtonTextInput}
                    autoFocus={true}
                    value={discount}
                    onChangeText={text => {
                      if (text <= totalPrice) {
                        setDiscount(text);
                      } else {
                        ToastAndroid.show(
                          'Discount cannot be greater than total amount',
                          ToastAndroid.LONG,
                        );
                      }
                    }}
                    keyboardType="decimal-pad"
                    placeholder="Discount"
                    placeholderTextColor={'#00000030'}
                    selectionColor={'#000'}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setDiscount(0);
                      setIsDiscountOpen(false);
                    }}>
                    <MaterialDesignIcons
                      name="close-circle"
                      size={24}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <Animated.View
                  key="discount-closed"
                  entering={FadeIn.duration(300)}
                  exiting={FadeOut.duration(200)}>
                  <Pressable
                    style={styles.floatingButtonContainer}
                    onPress={() => setIsDiscountOpen(true)}>
                    <Text style={styles.floatingButtonText}>Add Discount</Text>
                    <AntDesign name="plus" size={20} color="#fff" />
                  </Pressable>
                </Animated.View>
              )}
            </Animated.View>
          )}
        </Layout>
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          index={-1}
          handleComponent={() => null}
          backgroundStyle={{borderRadius: 0}}
          backdropComponent={renderBackdrop}
          animationConfigs={{
            duration: 250,
          }}
          enableHandlePanningGesture={false}>
          <BottomSheetView style={{flex: 1, padding: padding(15)}}>
            <View style={styles.bottomSheetContaienr}>
              <Text style={styles.bottomSheetTitleText}>
                Enter customer phone number
              </Text>
              <TouchableOpacity onPress={handleCloseBottomSheet}>
                <Ionicons name="close" size={20} color={'#000'} />
              </TouchableOpacity>
            </View>
            <Text style={styles.bottomSheetSubTitleText}>
              For sending sms & reminders
            </Text>
            <View style={styles.bottomSheetPhoneContainer}>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: fonts.popMedium,
                  color: '#000',
                }}>
                Phone number(Optional for Printing)
              </Text>
              <SimpleTextInput
                maxLength={10}
                hasError={
                  phoneNumber.length > 0 && !validateIndianPhone(phoneNumber)
                }
                value={phoneNumber}
                setValue={setPhoneNumber}
                keyboardType="phone-pad"
                placeholder="Customer Phone Number"
                borderColor="#00000090"
                placeholderTextColor="#00000095"
              />
            </View>
            <View style={styles.bottomSheetButtonContaienr}>
              <TouchableOpacity
                style={[
                  styles.bottomSheetButton,
                  {
                    backgroundColor: colors.sucess,
                  },
                ]}
                onPress={sentData}
                disabled={isSendLoading}>
                {isSendLoading ? (
                  <ActivityIndicator size={'small'} color={'#fff'} />
                ) : (
                  <Text style={styles.bottomSheetButtonText}>SEND</Text>
                )}{' '}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.bottomSheetButton,
                  {backgroundColor: colors.error},
                ]}
                onPress={printData}
                disabled={isPrintLoading}>
                {isPrintLoading ? (
                  <ActivityIndicator size={'small'} color={'#fff'} />
                ) : (
                  <Text style={styles.bottomSheetButtonText}>PRINT</Text>
                )}
              </TouchableOpacity>
            </View>
          </BottomSheetView>
        </BottomSheet>
        <CommonModal
          visible={isPaymentModalVisible}
          handleClose={closePaymentModal}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Payment Mode</Text>
            <View style={styles.modalRadioContainer}>
              {PAYMENT_OPTIONS.map((item, index) => (
                <RadioInput
                  label={item.toUpperCase()}
                  setValue={setPaymentMethod}
                  value={item}
                  isSelected={paymentMethod === item}
                  key={index}
                />
              ))}
            </View>
          </View>
        </CommonModal>
      </GestureHandlerRootView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: padding(16),
    marginTop: margin(10),
    paddingBottom: padding(80),
  },
  columnWrapperStyle: {
    gap: GAP_BETWEEN_ITEMS,
    marginBottom: margin(16),
  },
  bottomSheetContaienr: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomSheetTitleText: {
    fontSize: font(16),
    fontFamily: fonts.popMedium,
    color: '#000',
  },
  bottomSheetSubTitleText: {
    fontSize: font(11),
    fontFamily: fonts.popRegular,
    color: '#00000080',
  },
  bottomSheetPhoneContainer: {
    gap: gap(8),
    marginVertical: margin(20),
  },
  bottomSheetButtonContaienr: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap(15),
    marginBottom: margin(20),
  },
  bottomSheetButton: {
    paddingVertical: padding(6),
    paddingHorizontal: padding(20),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  bottomSheetButtonText: {
    fontSize: font(14),
    fontFamily: fonts.popSemiBold,
    color: '#fff',
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: padding(16),
  },
  modalTitle: {
    fontSize: font(16),
    fontFamily: fonts.popSemiBold,
    color: '#000',
  },
  modalRadioContainer: {
    marginTop: margin(20),
    gap: gap(10),
  },
  floatingButton: {
    position: 'absolute',
    zIndex: 1000,
    bottom: padding(100),
    alignSelf: 'center',
    backgroundColor: colors.sucess,
    paddingVertical: padding(8),
    paddingHorizontal: padding(16),
    borderRadius: 50,
  },
  floatingButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap(5),
  },
  floatingButtonText: {
    fontSize: font(14),
    fontFamily: fonts.popSemiBold,
    color: '#fff',
  },
  floatingButtonTextInput: {
    width: widthResponsive(220),
    fontFamily: fonts.inMedium,
    fontSize: font(16),
    color: '#000',
  },
  opendDiscountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  opendDiscountFloatingBtn: {
    backgroundColor: '#fff',
    borderWidth: 5,
    borderColor: colors.border,
  },
});

export default CreateBill;
