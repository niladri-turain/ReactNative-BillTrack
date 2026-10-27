import {
  ActivityIndicator,
  Dimensions,
  DeviceEventEmitter,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {BluetoothManager} from 'react-native-bluetooth-escpos-printer';
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
  StepGuide,
} from '../../Components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import Ionicons from '@react-native-vector-icons/ionicons';
import MaterialIcons from '@react-native-vector-icons/material-icons';
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
import {smsService} from '../../Services/SmsService';
import {
  useAuth,
  useAuthToken,
  useBusiness,
  useSubscription,
  useGstEnabled,
  useUser,
} from '../../Contexts/AuthContext';
import {useAppSettingsValue} from '../../Contexts/AppSettingContexts';
import {usePrinter} from '../../Contexts/PrinterContext';
import {calculateInvoiceData, generateInvoices} from '../../utils/helper';
import printerService from '../../utils/PrinterService';
import {sendToWhatsApp} from '../../utils/WhatsappShare';
import AntDesign from '@react-native-vector-icons/ant-design';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import Lucide from '@react-native-vector-icons/lucide';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {useInvoice} from '../../Contexts/InvoiceContext';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {stateService} from '../../Services/StateService';

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
  const navigation = useNavigation();
  const {width: screenWidth, height: screenHeight} = useWindowDimensions();
  const inset = useSafeAreaInsets();

  // Bottom bar height matches tab bar: 85 + inset.bottom
  const bottomBarHeight = 85 + inset.bottom;
  const floatingButtonBottom = bottomBarHeight + padding(20);

  const addInvoices = useInvoice('addInvoice');
  const {printer, setSelectedPrinter} = usePrinter();
  const business = useBusiness();
  const userName = useUser('name');
  const businessName = userName || business?.name;
  const userPhone = useUser('phone');
  const {updateNumberOfInvoices} = useAuth();
  const token = useAuthToken();
  const {Products, resetProductCount} = useProduct();
  const product = Products || [];
  const [quantity, setQuantity] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [discount, setDiscount] = useState(0);
  const discountInvalidToastShown = useRef(false);
  const discountInputRef = useRef(null);

  const [isDiscountOpen, setIsDiscountOpen] = useState(false);

  const discountAnim = useSharedValue(0);

  // Guided Tour State
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [guideTargets, setGuideTargets] = useState({});

  const firstProductRef = useRef(null);
  const createButtonRef = useRef(null);
  const phoneNumberRef = useRef(null);
  const sendButtonRef = useRef(null);
  const bottomSheetRef = useRef(null);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const measureRef = (key, ref) => {
    if (ref.current) {
      ref.current.measure((x, y, width, height, pageX, pageY) => {
        if (pageX || pageY) {
          setGuideTargets(prev => ({
            ...prev,
            [key]: {x: pageX, y: pageY, width, height},
          }));
        }
      });
    }
  };

  useEffect(() => {
    const checkStep1 = async () => {
      if (await AsyncStorage.getItem('skipAllStepGuides')) return;
      const hasSeen = await AsyncStorage.getItem('hasSeenCreateBillStep1');
      if (!hasSeen && product.length > 0) {
        setGuideStep(1);
        setShowGuide(true);
      }
    };
    if (guideStep === 0) checkStep1();
  }, [product?.length]);

  useEffect(() => {
    const checkStep2 = async () => {
      if (await AsyncStorage.getItem('skipAllStepGuides')) return;
      const hasSeen = await AsyncStorage.getItem('hasSeenCreateBillStep2');
      if (!hasSeen && quantity > 0 && guideStep !== 3) {
        // Re-measure create button as it might have moved or just appeared
        setTimeout(() => measureRef('create', createButtonRef), 200);
        setGuideStep(2);
        setShowGuide(true);
      }
    };
    checkStep2();
  }, [quantity]);

  const handleOpenBottomSheet = useCallback(() => {
    bottomSheetRef.current?.expand();
    Keyboard.dismiss();
    const checkStep3 = async () => {
      if (await AsyncStorage.getItem('skipAllStepGuides')) return;
      const hasSeen = await AsyncStorage.getItem('hasSeenCreateBillStep3');
      if (!hasSeen) {
        setGuideStep(3);
        setShowGuide(true);
        setTimeout(() => measureRef('send', sendButtonRef), 500);
      }
    };
    checkStep3();
  });

  const nextStep = async () => {
    setShowGuide(false);
    if (guideStep === 1) {
      await AsyncStorage.setItem('hasSeenCreateBillStep1', 'true');
    } else if (guideStep === 2) {
      await AsyncStorage.setItem('hasSeenCreateBillStep2', 'true');
    } else if (guideStep === 3) {
      await AsyncStorage.setItem('hasSeenCreateBillStep3', 'true');
    }
    setGuideStep(0);
  };

  // Sync shared value for color/border animation
  useEffect(() => {
    discountAnim.value = withSpring(isDiscountOpen ? 1 : 0, {
      damping: 15,
      stiffness: 100,
    });
  }, [isDiscountOpen]);

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
  const sendToSmsEnabled = useAppSettingsValue('SEND_TO_SMS');
  const printOnCreateBill = useAppSettingsValue('PRINT_ON_CREATE_BILL');
  const isPremiumPlanAndActive = useSubscription('isPremiumPlanAndActive');
  const isGstEnabled = useGstEnabled();

  // STATE VARIABLES
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCustomerDetailsEnabled, setIsCustomerDetailsEnabled] = useState(false);
  const [customerGstNumber, setCustomerGstNumber] = useState('');
  const [customerCompanyName, setCustomerCompanyName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerState, setCustomerState] = useState(null);
  const [states, setStates] = useState([]);
  const [isStateModalVisible, setIsStateModalVisible] = useState(false);
  const [isStatesLoading, setIsStatesLoading] = useState(false);
  const snapPoints = useMemo(
    () => [isGstEnabled && isCustomerDetailsEnabled ? '70%' : '40%'],
    [isGstEnabled, isCustomerDetailsEnabled],
  );

  // HSN Error State
  const [productsWithHsnError, setProductsWithHsnError] = useState([]);

  // LOADING STATE
  const [isPrintLoading, setIsPrintLoading] = useState(false);
  const [isSendLoading, setIsSendLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [isPendingPrint, setIsPendingPrint] = useState(false);
  const [isScannerModalVisible, setIsScannerModalVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchStates = async () => {
      setIsStatesLoading(true);
      try {
        const response = await stateService.getStates(token);
        if (isMounted && response?.status && Array.isArray(response.data)) {
          setStates(response.data);
        }
      } catch (error) {
        console.error('Unable to load customer states:', error);
      } finally {
        if (isMounted) setIsStatesLoading(false);
      }
    };
    fetchStates();
    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (!isScannerModalVisible) return undefined;

    const connectionListener = DeviceEventEmitter.addListener(
      BluetoothManager.EVENT_CONNECTED,
      () => setIsScannerModalVisible(false),
    );

    return () => connectionListener.remove();
  }, [isScannerModalVisible]);

  const handleCloseBottomSheet = useCallback(() => {
    bottomSheetRef.current?.close();
    Keyboard.dismiss();
  }, []);

  const handleOpenScanner = useCallback(() => {
    setIsScannerModalVisible(true);
    startScan();
  }, []);

  const handleCloseScanner = useCallback(() => {
    setIsScannerModalVisible(false);
    setIsPendingPrint(false);
  }, []);

  const startScan = async () => {
    setIsScanning(true);
    try {
      const allDevices = await printerService.scanDevices();
      setDevices(allDevices);
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleDeviceSelect = async (device) => {
    setIsScanning(true);
    try {
      const connected = await printerService.connectDevice(device.address);
      if (connected) {
        await setSelectedPrinter(device);
        ToastService.show({
          message: 'Printer connected successfully',
          type: 'success',
          position: 'top',
        });
        handleCloseScanner();

        // If we were waiting to print, trigger it now
        if (isPendingPrint) {
          setIsPendingPrint(false);
          printData();
        }
      } else {
        ToastService.show({
          message: 'Failed to connect printer',
          type: 'error',
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setIsScanning(false);
    }
  };

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
    setProductsWithHsnError([]);
    if (!quantity) {
      ToastService.show({
        message: 'Please Add Products',
        type: 'error',
        position: 'top',
      });
      return;
    }
    
    if (isGstEnabled) {
      const selectedItemsWithoutHsn = product.filter(
        item =>
          item.count > 0 &&
          (!item.hsn || typeof item.hsn !== 'object' || Object.keys(item.hsn).length === 0)
      );

      if (selectedItemsWithoutHsn.length > 0) {
        setProductsWithHsnError(selectedItemsWithoutHsn.map(p => p.id));
        ToastService.show({
          message: 'Cannot create bill. HSN code required.',
          type: 'error',
          position: 'bottom',
          paddingHorizontal: padding(16),
        });
        return;
      }
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

    if (!printer) {
      setIsPendingPrint(true);
      handleOpenScanner();
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
            hsnId: item?.hsnId || null,
            hsnCode: item?.hsn?.hsnCode || "",
            rate: Number(item?.price).toFixed(2),
            originalPrice: item?.price,
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
        customerGstNumber: isCustomerDetailsEnabled ? customerGstNumber : '',
        customerCompanyName: isCustomerDetailsEnabled ? customerCompanyName : '',
        customerAddress: isCustomerDetailsEnabled ? customerAddress : '',
        customerState: isCustomerDetailsEnabled ? customerState?.name || '' : '',
        discount,
        invoiceNumber: invoiceNo,
        businessName: businessName,
        userPhone: userPhone
      };
      const data = await invoiceService.createInvoice(payload);
      if (data?.status) {
        addInvoices(data?.invoice);
        ToastService.show({
          message: 'Bill Created Successfully',
          type: 'success',
          position: 'top',
        });

        const invoice = data?.invoice;
        const invoiceItems = await invoiceService.getInvoiceItems(
          invoice?.id,
          token,
        );
        const {
          gstListCalculate,
          items,
          subTotalAmount,
          totalQuantity,
          breakdownTotalAmount,
          roundOffAmount,
        } =
          calculateInvoiceData(
            invoiceItems?.items,
            invoice?.discountAmount,
            invoice?.totalAmount,
          );

        if (printer) {
          await printerService.printInvoice(
            invoice,
            items,
            gstListCalculate,
            totalQuantity,
            subTotalAmount,
            breakdownTotalAmount,
            roundOffAmount,
            {...business, name: businessName},
            token,
          );
        }

        await updateInvoiceNumber(numberOfInvoices);
        restartClickOfHeader();
        navigation.navigate('Home');
      }
    } catch (error) {
      console.error('Print logic error:', error);
    } finally {
      setIsPrintLoading(false);
    }
  };

  const saveOnlyData = async () => {
    if (phoneNumber && !validateIndianPhone(phoneNumber)) {
      ToastService.show({
        message: 'Please enter a valid phone number',
        type: 'error',
        position: 'top',
      });
      return;
    }
    try {
      setIsSaveLoading(true);
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
            hsnId: item?.hsnId || null,
            hsnCode: item?.hsn?.hsnCode || '',
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

      const data = await invoiceService.createInvoice({
        token,
        customerNumber: phoneNumber,
        customerGstNumber: isCustomerDetailsEnabled ? customerGstNumber : '',
        customerCompanyName: isCustomerDetailsEnabled ? customerCompanyName : '',
        customerAddress: isCustomerDetailsEnabled ? customerAddress : '',
        customerState: isCustomerDetailsEnabled ? customerState?.name || '' : '',
        items: selectedItems,
        paymentMode: paymentMethod,
        discount,
        invoiceNumber: invoiceNo,
        businessName: businessName,
        userPhone: userPhone,
      });

      if (data?.status) {
        addInvoices(data?.invoice);
        ToastService.show({
          message: 'Bill Created Successfully',
          type: 'success',
          position: 'top',
        });
        await updateInvoiceNumber(numberOfInvoices);
        restartClickOfHeader();
        navigation.navigate('Home');
      }
    } catch (error) {
    } finally {
      setIsSaveLoading(false);
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
            hsnId: item?.hsnId || null,
            hsnCode: item?.hsn?.hsnCode || "",
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

      const data = await invoiceService.createInvoice({
        token,
        customerNumber: phoneNumber,
        customerGstNumber: isCustomerDetailsEnabled ? customerGstNumber : '',
        customerCompanyName: isCustomerDetailsEnabled ? customerCompanyName : '',
        customerAddress: isCustomerDetailsEnabled ? customerAddress : '',
        customerState: isCustomerDetailsEnabled ? customerState?.name || '' : '',
        items: selectedItems,
        paymentMode: paymentMethod,
        discount,
        invoiceNumber: invoiceNo,
        businessName: businessName,
        userPhone: userPhone,
      });
      if (data?.status) {
        addInvoices(data?.invoice);
        const whatsappAmounts = calculateInvoiceData(
          selectedItems,
          discount,
          data?.invoice?.totalAmount,
        );
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
        setProductsWithHsnError([]);
        handleCloseBottomSheet();
        await updateInvoiceNumber(numberOfInvoices);
        if (sentWhatAppEnabled) {
          const whatsappSent = await sendToWhatsApp({
            businessName: businessName,
            invoiceNumber: data?.invoice?.invoiceNumber,
            createdAt: data?.invoice?.createdAt,
            customerNumber: data?.invoice?.customerNumber,
            totalAmount: data?.invoice?.totalAmount,
            breakdownTotalAmount: whatsappAmounts.breakdownTotalAmount,
            roundOffAmount: whatsappAmounts.roundOffAmount,
            paymentMode: data?.invoice?.paymentMode,
            businessId: business?.id,
          });

          // Only once WhatsApp goes through do we also send the SMS —
          // the same SMS the InvoiceCard "SMS" button sends.
          if (whatsappSent && sendToSmsEnabled && data?.invoice?.customerNumber) {
            await smsService.sendInvoiceSms({
              token,
              businessName: businessName,
              phone: data?.invoice?.customerNumber,
              invoiceNumber: data?.invoice?.invoiceNumber,
              totalAmount: data?.invoice?.totalAmount,
              businessId: business?.id,
            });
          }
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

  const restartClickOfHeader = useCallback(() => {
    Keyboard.dismiss();
    discountInputRef.current?.clear();
    discountAnim.value = withSpring(0, {
      damping: 15,
      stiffness: 100,
    });
    setPhoneNumber('');
    setQuantity(0);
    setDiscount(0);
    setTotalPrice(0);
    setIsDiscountOpen(false);
    discountInvalidToastShown.current = false;
    resetProductCount();
    setProductsWithHsnError([]);
    handleCloseBottomSheet();
  }, [discountAnim, handleCloseBottomSheet, resetProductCount]);

  useFocusEffect(
    useCallback(() => {
      restartClickOfHeader();
      return restartClickOfHeader;
    }, [restartClickOfHeader]),
  );

  const handleCreateBillBack = useCallback(() => {
    restartClickOfHeader();
    navigation.goBack();
  }, [navigation, restartClickOfHeader]);

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      enabled={Platform.OS === 'ios' || isKeyboardVisible}
      keyboardVerticalOffset={0}>
      <GestureHandlerRootView style={{flex: 1}}>
        <Layout>
          <SecondaryHeader
            title="Create Bill"
            handleBack={handleCreateBillBack}
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
              <View
                ref={index === 0 ? firstProductRef : null}
                onLayout={
                  index === 0 ? () => measureRef('product', firstProductRef) : null
                }>
                <BillProductCard
                  width={ITEM_WIDTH}
                  item={item}
                  setQuantity={setQuantity}
                  setTotalPrice={setTotalPrice}
                  key={index + '_bill_card'}
                  hasHsnError={productsWithHsnError.includes(item.id)}
                />
              </View>
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
            createButtonRef={createButtonRef}
            onLayout={() => measureRef('create', createButtonRef)}
          />
          {quantity > 0 && (
            <Animated.View
              key="discount-control"
              style={[
                styles.floatingButton,
                floatingButtonAnimStyle,
                {bottom: floatingButtonBottom},
              ]}>
              {isDiscountOpen ? (
                <Animated.View
                  key="discount-open"
                  style={styles.opendDiscountContainer}>
                  <Lucide
                    name="indian-rupee"
                    size={16}
                    color={colors.primary}
                  />
                  {/* Added autoFocus to improve UX */}
                  <TextInput
                    ref={discountInputRef}
                    style={styles.floatingButtonTextInput}
                    autoFocus={true}
                    value={discount}
                    onChangeText={text => {
                      if (!/^\d*\.?\d*$/.test(text)) {
                        // The keyboard has already drawn the invalid character
                        // natively before this handler runs, so force the
                        // native text back to the last valid value instead of
                        // just skipping the state update — otherwise the
                        // rejected character stays visible on screen.
                        discountInputRef.current?.setNativeProps({
                          text: String(discount),
                        });
                        if (!discountInvalidToastShown.current) {
                          discountInvalidToastShown.current = true;
                          ToastAndroid.show(
                            'Only numbers are allowed, no special characters or spaces',
                            ToastAndroid.LONG,
                          );
                        }
                        return;
                      }
                      discountInvalidToastShown.current = false;

                      let normalizedText = text.startsWith('.')
                        ? `0${text}`
                        : text;
                      const [integerPart, decimalPart] = normalizedText.split('.');
                      const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '');
                      normalizedText = decimalPart === undefined
                        ? normalizedInteger
                        : `${normalizedInteger}.${decimalPart.slice(0, 2)}`;

                      if (!normalizedText || Number(normalizedText) <= totalPrice) {
                        setDiscount(normalizedText);
                      } else {
                        discountInputRef.current?.setNativeProps({
                          text: String(discount),
                        });
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
                  key="discount-closed">
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
          keyboardBehavior="fillParent"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustResize"
          handleComponent={() => null}
          backgroundStyle={{
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            backgroundColor: '#fff',
          }}
          backdropComponent={renderBackdrop}
          animationConfigs={{
            duration: 250,
          }}
          enableHandlePanningGesture={false}>
          <BottomSheetScrollView
            style={{flex: 1}}
            contentContainerStyle={styles.customerSheetContent}
            keyboardShouldPersistTaps="handled">
            <View style={styles.customerSheetHandle} />
            <View style={styles.bottomSheetContaienr}>
              <Text style={styles.bottomSheetTitleText}>
                Customer Details
              </Text>
              <TouchableOpacity
                style={styles.customerSheetCloseButton}
                onPress={handleCloseBottomSheet}>
                <Ionicons name="close" size={18} color={'#555B63'} />
              </TouchableOpacity>
            </View>
            <Text style={styles.bottomSheetSubTitleText}>
              For sending sms & reminders
            </Text>
            {isGstEnabled && (
              <View style={styles.customerDetailsToggleRow}>
                <Text style={styles.customerDetailsToggleText}>Business Details(B2B)</Text>
                <Switch
                  value={isCustomerDetailsEnabled}
                  onValueChange={setIsCustomerDetailsEnabled}
                  trackColor={{false: '#00000030', true: colors.sucess}}
                  thumbColor="#fff"
                />
              </View>
            )}
            <View style={styles.customerFieldsContainer}>
              {isGstEnabled && isCustomerDetailsEnabled && (
                <>
                  <SimpleTextInput
                    value={customerGstNumber}
                    setValue={setCustomerGstNumber}
                    leadingIcon="description"
                    placeholder="Customer GST Number"
                    borderColor="#D7D9DE"
                    borderRadius={10}
                    height={icon(50)}
                    placeholderTextColor="#858991"
                    autoCapitalize="characters"
                  />
                  <SimpleTextInput
                    value={customerCompanyName}
                    setValue={setCustomerCompanyName}
                    leadingIcon="business"
                    placeholder="Customer Company Name"
                    borderColor="#D7D9DE"
                    borderRadius={10}
                    height={icon(50)}
                    placeholderTextColor="#858991"
                  />
                  <SimpleTextInput
                    value={customerAddress}
                    setValue={setCustomerAddress}
                    leadingIcon="place"
                    placeholder="Customer Address"
                    borderColor="#D7D9DE"
                    borderRadius={10}
                    height={icon(50)}
                    placeholderTextColor="#858991"
                  />
                  <TouchableOpacity
                    style={styles.customerStateSelect}
                    onPress={() => setIsStateModalVisible(true)}
                    disabled={isStatesLoading}>
                    <MaterialIcons name="map" size={18} color="#777B83" />
                    <Text
                      style={[
                        styles.customerStateSelectText,
                        !customerState && styles.customerStatePlaceholder,
                      ]}>
                      {isStatesLoading
                        ? 'Loading states...'
                        : customerState?.name || 'Select state'}
                    </Text>
                    <MaterialIcons
                      name="arrow-drop-down"
                      size={24}
                      color="#777"
                    />
                  </TouchableOpacity>
                </>
              )}
              <View
                ref={phoneNumberRef}
                onLayout={() => measureRef('phone', phoneNumberRef)}
                style={styles.customerPhoneField}>
                <Text style={styles.customerPhoneLabel}>
                  Phone number(Optional for Printing)
                </Text>
                <SimpleTextInput
                  maxLength={10}
                  hasError={
                    phoneNumber.length > 0 && !validateIndianPhone(phoneNumber)
                  }
                  value={phoneNumber}
                  setValue={val => setPhoneNumber(val.replace(/[^0-9]/g, ''))}
                  leadingIcon="call"
                  keyboardType="phone-pad"
                  placeholder="Customer Phone Number"
                  borderColor="#D7D9DE"
                  borderRadius={10}
                  height={icon(50)}
                  placeholderTextColor="#858991"
                />
              </View>
            </View>
            <View style={styles.bottomSheetButtonContaienr}>
              <TouchableOpacity
                style={[
                  styles.bottomSheetButton,
                  {backgroundColor: colors.primary},
                ]}
                onPress={saveOnlyData}
                disabled={isSaveLoading}>
                {isSaveLoading ? (
                  <ActivityIndicator size={'small'} color={'#fff'} />
                ) : (
                  <Text style={styles.bottomSheetButtonText}>SAVE</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                ref={sendButtonRef}
                onLayout={() => measureRef('send', sendButtonRef)}
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
                )}
              </TouchableOpacity>
              {printOnCreateBill && (
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
              )}
            </View>
          </BottomSheetScrollView>
        </BottomSheet>

        <Modal
          visible={isStateModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsStateModalVisible(false)}>
          <View style={styles.stateModalOverlay}>
            <View style={styles.stateModal}>
              <Text style={styles.stateModalTitle}>Select state</Text>
              <FlatList
                data={states}
                keyExtractor={item => String(item.id)}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={styles.stateOption}
                    onPress={() => {
                      setCustomerState(item);
                      setIsStateModalVisible(false);
                    }}>
                    <Text style={styles.stateOptionText}>{item.name}</Text>
                    {customerState?.id === item.id && (
                      <MaterialIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={(
                  <Text style={styles.emptyStates}>
                    {isStatesLoading ? 'Loading states...' : 'No states available'}
                  </Text>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Bluetooth Scanner Modal */}
        <CommonModal
          visible={isScannerModalVisible}
          handleClose={handleCloseScanner}>
          <View style={styles.modalContent}>
            <View style={styles.bottomSheetContaienr}>
              <Text style={styles.bottomSheetTitleText}>Select Printer</Text>
              <TouchableOpacity onPress={handleCloseScanner}>
                <Ionicons name="close" size={24} color={'#000'} />
              </TouchableOpacity>
            </View>

            <View style={{maxHeight: 400}}>
              {isScanning ? (
                <View style={{marginVertical: 20, alignItems: 'center'}}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={{marginTop: 10, fontFamily: fonts.popRegular}}>
                    Scanning for devices...
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={devices}
                  keyExtractor={item => item.address}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      style={styles.deviceItem}
                      onPress={() => handleDeviceSelect(item)}>
                      <Ionicons
                        name="print-outline"
                        size={20}
                        color={colors.primary}
                      />
                      <View style={{marginLeft: 15}}>
                        <Text style={styles.deviceName}>
                          {item.name || 'Unknown Device'}
                        </Text>
                        <Text style={styles.deviceAddress}>{item.address}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={() => (
                    <Text style={{textAlign: 'center', marginVertical: 20}}>
                      No devices found. Make sure Bluetooth is on.
                    </Text>
                  )}
                />
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.bottomSheetButton,
                {backgroundColor: colors.primary, marginTop: 20},
              ]}
              onPress={startScan}>
              <Text style={styles.bottomSheetButtonText}>RE-SCAN</Text>
            </TouchableOpacity>
          </View>
        </CommonModal>

        {showGuide && guideTargets.create && guideStep === 2 && quantity > 0 && (
          <StepGuide
            target={guideTargets.create}
            text="Once added, tap CREATE to proceed"
            onNext={nextStep}
            arrowPosition="bottom"
          />
        )}
        {showGuide && (guideTargets.send || guideTargets.phone) && guideStep === 3 && (
          <StepGuide
            target={guideTargets.send || guideTargets.phone}
            text="Enter phone number and tap SEND or PRINT to generate bill"
            onNext={nextStep}
            arrowPosition="bottom"
          />
        )}
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
  customerSheetContent: {
    paddingHorizontal: padding(16),
    paddingTop: padding(8),
    paddingBottom: padding(10),
  },
  customerSheetHandle: {
    alignSelf: 'center',
    width: widthResponsive(38),
    height: 4,
    borderRadius: 4,
    backgroundColor: '#D9DADD',
    marginBottom: margin(12),
  },
  customerSheetCloseButton: {
    width: icon(32),
    height: icon(32),
    borderRadius: icon(16),
    backgroundColor: '#F1F2F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    fontSize: font(15),
    fontFamily: fonts.popSemiBold,
    color: '#000',
  },
  bottomSheetSubTitleText: {
    fontSize: font(10),
    fontFamily: fonts.popRegular,
    color: '#00000080',
  },
  customerDetailsToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: margin(12),
    paddingHorizontal: padding(12),
    minHeight: icon(44),
    borderRadius: 10,
    backgroundColor: '#FFF3E8',
  },
  customerDetailsToggleText: {
    fontSize: font(13),
    fontFamily: fonts.popMedium,
    color: '#000',
  },
  customerFieldsContainer: {
    gap: gap(16),
    marginTop: margin(16),
  },
  customerPhoneField: {
    gap: gap(12),
  },
  customerPhoneLabel: {
    fontSize: 12,
    fontFamily: fonts.popMedium,
    color: '#000',
    marginBottom: margin(4),
  },
  customerStateSelect: {
    height: icon(50),
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: padding(16),
    borderWidth: 1,
    borderColor: '#D7D9DE',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  customerStateSelectText: {
    fontSize: font(12),
    fontFamily: fonts.onMedium,
    color: '#222',
    flex: 1,
    marginLeft: 10,
  },
  customerStatePlaceholder: {
    color: '#858991',
  },
  stateModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: padding(24),
    backgroundColor: '#00000070',
  },
  stateModal: {
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: padding(16),
    paddingTop: padding(16),
  },
  stateModalTitle: {
    fontSize: font(16),
    fontFamily: fonts.popSemiBold,
    color: '#000',
    paddingBottom: padding(10),
  },
  stateOption: {
    minHeight: icon(44),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#00000020',
    paddingVertical: padding(8),
  },
  stateOptionText: {
    fontSize: font(14),
    fontFamily: fonts.popRegular,
    color: '#222',
  },
  emptyStates: {
    paddingVertical: padding(20),
    color: '#777',
    textAlign: 'center',
  },
  bottomSheetButtonContaienr: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap(8),
    marginTop: margin(20),
    marginBottom: margin(10),
  },
  bottomSheetButton: {
    flex: 1,
    minHeight: icon(42),
    paddingHorizontal: padding(6),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 7,
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
    alignSelf: 'center',
    backgroundColor: colors.sucess,
    paddingVertical: padding(8),
    paddingHorizontal: padding(16),
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
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
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  deviceName: {
    fontFamily: fonts.popSemiBold,
    fontSize: font(14),
    color: '#000',
  },
  deviceAddress: {
    fontFamily: fonts.popRegular,
    fontSize: font(12),
    color: '#666',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: padding(20),
    width: '100%',
  },
});

export default CreateBill;
