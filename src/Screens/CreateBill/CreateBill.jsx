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
  useWindowDimensions,
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
  StepGuide,
} from '../../Components';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  useGstEnabled,
  useUser,
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
import {useFocusEffect, useNavigation} from '@react-navigation/native';

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
  const {getByKey} = useAppSettings();
  const token = useAuthToken();
  const {Products, resetProductCount} = useProduct();
  const product = Products || [];
  const [quantity, setQuantity] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [discount, setDiscount] = useState(0);

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
  const isGstEnabled = useGstEnabled();

  // STATE VARIABLES
  const [phoneNumber, setPhoneNumber] = useState('');

  // HSN Error State
  const [productsWithHsnError, setProductsWithHsnError] = useState([]);

  // LOADING STATE
  const [isPrintLoading, setIsPrintLoading] = useState(false);
  const [isSendLoading, setIsSendLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [isPendingPrint, setIsPendingPrint] = useState(false);

  // BOTTOMSHEET
  const bottomSheetRef = useRef(null);
  const scannerBottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['30%'], []);
  const scannerSnapPoints = useMemo(() => ['50%'], []);

  const handleCloseBottomSheet = useCallback(() => {
    bottomSheetRef.current?.close();
    Keyboard.dismiss();
  }, []);

  const handleOpenScanner = useCallback(() => {
    scannerBottomSheetRef.current?.expand();
    startScan();
  }, []);

  const handleCloseScanner = useCallback(() => {
    scannerBottomSheetRef.current?.close();
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
        );
        const {gstListCalculate, items, subTotalAmount, totalQuantity} =
          calculateInvoiceData(invoiceItems?.items, invoice?.discountAmount);

        // Check if printing is enabled in settings or if it was a manual print action
        const printOnCreateBill = getByKey('PRINT_ON_CREATE_BILL');
        // Manual print (isPendingPrint was true) OR auto-print enabled
        if (isPendingPrint || printOnCreateBill || isPremiumPlanAndActive) {
           await printerService.printInvoice(
            invoice,
            items,
            gstListCalculate,
            totalQuantity,
            subTotalAmount,
            {...business, name: businessName},
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
          await sendToWhatsApp({
            businessName: businessName,
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
    setProductsWithHsnError([]);
    handleCloseBottomSheet();
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
              // This automatically animates width/height changes smoothly
              layout={LinearTransition.springify().damping(15).stiffness(120)}
              style={[
                styles.floatingButton,
                floatingButtonAnimStyle,
                {bottom: floatingButtonBottom},
              ]}>
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
            <View
              ref={phoneNumberRef}
              onLayout={() => measureRef('phone', phoneNumberRef)}
              style={styles.bottomSheetPhoneContainer}>
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
                setValue={val => {
                  const cleaned = val.replace(/[^0-9]/g, '');
                  setPhoneNumber(cleaned);
                }}
                keyboardType="phone-pad"
                placeholder="Customer Phone Number"
                borderColor="#00000090"
                placeholderTextColor="#00000095"
              />
            </View>
            <View style={styles.bottomSheetButtonContaienr}>
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

        {/* Bluetooth Scanner BottomSheet */}
        <BottomSheet
          ref={scannerBottomSheetRef}
          snapPoints={scannerSnapPoints}
          index={-1}
          handleComponent={() => null}
          backgroundStyle={{borderRadius: 16}}
          backdropComponent={renderBackdrop}
        >
          <BottomSheetView style={{flex: 1, padding: padding(20)}}>
             <View style={styles.bottomSheetContaienr}>
                <Text style={styles.bottomSheetTitleText}>Select Printer</Text>
                <TouchableOpacity onPress={handleCloseScanner}>
                  <Ionicons name="close" size={24} color={'#000'} />
                </TouchableOpacity>
             </View>

             {isScanning ? (
               <View style={{marginTop: 20, alignItems: 'center'}}>
                 <ActivityIndicator size="large" color={colors.primary} />
                 <Text style={{marginTop: 10, fontFamily: fonts.popRegular}}>Scanning for devices...</Text>
               </View>
             ) : (
               <FlatList
                 data={devices}
                 keyExtractor={(item) => item.address}
                 renderItem={({item}) => (
                   <TouchableOpacity
                     style={styles.deviceItem}
                     onPress={() => handleDeviceSelect(item)}
                   >
                     <Ionicons name="print-outline" size={20} color={colors.primary} />
                     <View style={{marginLeft: 15}}>
                       <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
                       <Text style={styles.deviceAddress}>{item.address}</Text>
                     </View>
                   </TouchableOpacity>
                 )}
                 ListEmptyComponent={() => (
                   <Text style={{textAlign: 'center', marginTop: 20}}>No devices found. Make sure Bluetooth is on.</Text>
                 )}
               />
             )}

             <TouchableOpacity
               style={[styles.bottomSheetButton, {backgroundColor: colors.primary, marginTop: 20}]}
               onPress={startScan}
             >
               <Text style={styles.bottomSheetButtonText}>RE-SCAN</Text>
             </TouchableOpacity>
          </BottomSheetView>
        </BottomSheet>

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
});

export default CreateBill;
