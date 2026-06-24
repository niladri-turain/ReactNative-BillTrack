import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useMemo, useState, useRef} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {
  CommonModal,
  NavigationCardWithValue,
  SecondaryHeader,
  SimpleTextInput,
} from '../../Components';
import {Layout} from '../Layout';
import {font, gap, icon, margin, padding} from '../../utils/responsive';
import {useAuth, useAuthToken, useBusiness, useUser, useUpdateUserFields} from '../../Contexts/AuthContext';
import {API_URL} from '../../utils/config';
import {colors} from '../../utils/colors';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import Lucide from '@react-native-vector-icons/lucide';
import Ionicons from '@react-native-vector-icons/ionicons';
import {businessCategoryService} from '../../Services/BusinessCategoryService';
import {fonts} from '../../utils/fonts';
import {
  validateEmail,
  validateIndianGST,
  validateIndianPhone,
  validateIndianPincode,
} from '../../utils/validator';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import ToastService from '../../Components/Toasts/ToastService';
import {businessService} from '../../Services/BusinessService';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Business = () => {
  const business = useBusiness();
  const token = useAuthToken();
  const {resetBusiness} = useAuth();
  const userPhone = useUser('phone');
  const userEmail = useUser('email');
  const [businessCategory, setBusinessCategory] = useState([]);

  // MODAL STATES
  const [isModal, setIsModal] = useState(false);
  const [modalType, setModalType] = useState('Phone Number');

  // STATE VARIABLES
  const [mobileNumber, setMobileNumber] = useState(business?.phone || userPhone || '');
  const [email, setEmail] = useState(userEmail || '');
  const [gstNumber, setGstNumber] = useState(business?.gstNumber || '');
  const [street, setStreet] = useState(business?.street || '');
  const [city, setCity] = useState(business?.city || '');
  const [pincode, setPincode] = useState(business?.pinCode || '');
  const [state, setState] = useState(business?.state || '');
  const [prefix, setPrefix] = useState(business?.prefix || '');
  const [tempValue, setTempValue] = useState('');

  // ANIMATION STATE
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // LOADING STATE
  const [isSaveLoading, setIsSaveLoading] = useState(false);

  const fetchBusinessCategory = async () => {
    try {
      const data = await businessCategoryService.getAllBusinessCategory();
      setBusinessCategory(data);
    } catch (error) {}
  };

  useEffect(() => {
    fetchBusinessCategory();
  }, []);

  useEffect(() => {
    setEmail(userEmail || '');
  }, [userEmail]);

  const handleOpenModal = ({type}) => {
    setModalType(type);
    setIsModal(true);
    switch (type) {
      case 'Phone Number':
        setTempValue(mobileNumber);
        break;
      case 'Email Address':
        setTempValue(email);
        break;
      case 'GST Number':
        setTempValue(gstNumber);
        break;
      case 'State':
        setTempValue(state);
        break;
      case 'City':
        setTempValue(city);
        break;
      case 'Pincode':
        setTempValue(pincode);
        break;
      case 'Street':
        setTempValue(street);
        break;
      case 'Prefix':
        setTempValue(prefix);
        break;
      default:
        setTempValue('');
    }
  };

  const handleCloseModal = () => {
    setIsModal(false);
  };

  useEffect(() => {
    if (isModal) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        delay: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [isModal, fadeAnim]);

  const handleSave = async () => {
    const updatedValues = {
      phone: modalType === 'Phone Number' ? tempValue : mobileNumber,
      email: modalType === 'Email Address' ? tempValue : email,
      gstNumber: modalType === 'GST Number' ? tempValue : gstNumber,
      street: modalType === 'Street' ? tempValue : street,
      city: modalType === 'City' ? tempValue : city,
      pincode: modalType === 'Pincode' ? tempValue : pincode,
      state: modalType === 'State' ? tempValue : state,
      prefix: modalType === 'Prefix' ? tempValue : prefix,
    };

    const hasChanged =
      updatedValues.phone !== initialValues.phone ||
      updatedValues.email !== initialValues.email ||
      updatedValues.gstNumber !== initialValues.gstNumber ||
      updatedValues.street !== initialValues.street ||
      updatedValues.city !== initialValues.city ||
      updatedValues.pincode !== initialValues.pincode ||
      updatedValues.state !== initialValues.state ||
      updatedValues.prefix !== initialValues.prefix;

    if (!hasChanged) {
      ToastService.show({
        message: 'No changes detected',
        type: 'info',
      });
      return;
    }

    if (!updatedValues.state) {
      ToastService.show({
        message: 'Please select state',
        type: 'error',
      });
      return;
    }

    if (!updatedValues.street) {
      ToastService.show({
        message: 'Please enter street',
        type: 'error',
      });
      return;
    }

    if (!updatedValues.city) {
      ToastService.show({
        message: 'Please enter city',
        type: 'error',
      });
      return;
    }

    if (!updatedValues.pincode) {
      ToastService.show({
        message: 'Please enter pincode',
        type: 'error',
      });
      return;
    }

    if (!updatedValues.prefix) {
      ToastService.show({
        message: 'Please enter prefix',
        type: 'error',
      });
      return;
    }

    if (updatedValues.prefix.length >= 6) {
      ToastService.show({
        message: 'Prefix should be less than 6 characters',
        type: 'error',
      });
      return;
    }

    if (updatedValues.phone && !validateIndianPhone(updatedValues.phone)) {
      ToastService.show({
        message: 'Invalid Phone Number',
        type: 'error',
      });
      return;
    }

    if (updatedValues.email && !validateEmail(updatedValues.email)) {
      ToastService.show({
        message: 'Invalid Email',
        type: 'error',
      });
      return;
    }

    if (updatedValues.gstNumber && !validateIndianGST(updatedValues.gstNumber)) {
      ToastService.show({
        message: 'Invalid GST Number',
        type: 'error',
      });
      return;
    }

    if (updatedValues.pincode && !validateIndianPincode(updatedValues.pincode)) {
      ToastService.show({
        message: 'Invalid Pincode',
        type: 'error',
      });
      return;
    }

    const saveBusiness = async () => {
      try {
        setIsSaveLoading(true);
        const data = await businessService.updateBusiness({
          token: token,
          gstNumber: updatedValues.gstNumber,
          street: updatedValues.street,
          city: updatedValues.city,
          state: updatedValues.state,
          pinCode: updatedValues.pincode,
          email: updatedValues.email,
          phone: updatedValues.phone,
          prefix: updatedValues.prefix,
        });
        if (data.status) {
          ToastService.show({
            message: 'Business updated successfully',
            type: 'success',
          });
          const updatedBusiness = data?.business;

          setMobileNumber(updatedValues.phone);
          setEmail(updatedValues.email);
          setGstNumber(updatedValues.gstNumber);
          setStreet(updatedValues.street);
          setCity(updatedValues.city);
          setPincode(updatedValues.pincode);
          setState(updatedValues.state);
          setPrefix(updatedValues.prefix);

          await resetBusiness(updatedBusiness);
          handleCloseModal();
        }
      } catch (error) {
      } finally {
        setIsSaveLoading(false);
      }
    };

    if (updatedValues.gstNumber && updatedValues.gstNumber !== initialValues.gstNumber) {
      Alert.alert(
        'GST Number Update',
        `Updating the GST Number will affect:
    
1. Products: GST must be applied/updated on all products.
2. Pricing: Prices may change based on GST calculation.
3. Invoices: New GST number will show on all future invoices.
4. Accounting: Update records and reports accordingly.
5. Legal: Ensure GST number is valid and compliant.
6. Data: Backup data before making changes.
7. Testing: Verify checkout, invoices and tax calculations.

Proceed only if you have completed the required steps and approvals.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              return;
            },
          },
          {
            text: 'OK',
            onPress: saveBusiness,
          },
        ],
        {cancelable: false},
      );
    } else {
      saveBusiness();
    }
  };

  const renderModalContent = useMemo(() => {
    switch (modalType) {
      case 'Phone Number':
        return (
          <SimpleTextInput
            placeholder={`Enter ${modalType}`}
            value={tempValue}
            setValue={setTempValue}
            keyboardType="numeric"
            maxLength={10}
            hasError={tempValue > 0 && !validateIndianPhone(tempValue)}
          />
        );
      case 'Email Address':
        return (
          <SimpleTextInput
            placeholder={'Enter Email Address'}
            value={tempValue}
            setValue={setTempValue}
            keyboardType="email-address"
            hasError={tempValue && !validateEmail(tempValue)}
          />
        );
      case 'GST Number':
        return (
          <SimpleTextInput
            placeholder={'Enter GST Number'}
            value={tempValue}
            setValue={val => setTempValue(val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
            keyboardType="default"
            hasError={tempValue && !validateIndianGST(tempValue)}
            upperCase={true}
            maxLength={15}
          />
        );
      case 'State':
        return (
          <SimpleTextInput
            label="Enter State"
            value={tempValue}
            setValue={setTempValue}
            keyboardType="default"
          />
        );
      case 'City':
        return (
          <SimpleTextInput
            label="Enter City"
            value={tempValue}
            setValue={setTempValue}
            keyboardType="default"
          />
        );
      case 'Pincode':
        return (
          <SimpleTextInput
            label="Enter Pincode"
            value={tempValue}
            setValue={setTempValue}
            keyboardType="numeric"
            hasError={tempValue && !validateIndianPincode(tempValue)}
          />
        );
      case 'Street':
        return (
          <SimpleTextInput
            label="Enter Street"
            value={tempValue}
            setValue={setTempValue}
            keyboardType="default"
          />
        );
      case 'Prefix':
        return (
          <SimpleTextInput
            label="Enter Prefix"
            value={tempValue}
            setValue={val => setTempValue(val.toUpperCase())}
            keyboardType="default"
            maxLength={6}
            upperCase={true}
          />
        );
      default:
        return null;
    }
  }, [modalType, tempValue]);

  // Store original values for comparison
  const initialValues = useMemo(
    () => ({
      phone: business?.phone || '',
      email: business?.email || '',
      gstNumber: business?.gstNumber || '',
      street: business?.street || '',
      city: business?.city || '',
      pincode: business?.pinCode || '',
      state: business?.state || '',
      prefix: business?.prefix || '',
    }),
    [business],
  );

  // Detect if anything changed
  const isChanged = useMemo(() => {
    return (
      mobileNumber !== initialValues.phone ||
      email !== initialValues.email ||
      gstNumber !== initialValues.gstNumber ||
      street !== initialValues.street ||
      city !== initialValues.city ||
      pincode !== initialValues.pincode ||
      state !== initialValues.state ||
      prefix !== initialValues.prefix
    );
  }, [
    mobileNumber,
    email,
    gstNumber,
    street,
    city,
    pincode,
    state,
    initialValues,
    prefix,
  ]);

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      enabled={!isModal}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <GestureHandlerRootView style={{flex: 1}}>
        <Layout>
          <SecondaryHeader title="Business Setting" isSearch={false} />
          <ScrollView
            style={{flex: 1}}
            contentContainerStyle={styles.container}>
            <View style={[styles.rowContainer, styles.profileContainer]}>
              <LinearGradient
                colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.gradientBorder}>
                <Image
                  style={styles.profileImage}
                  resizeMode="contain"
                  source={{uri: `${API_URL}files/logo/${business?.logoUrl}`}}
                />
              </LinearGradient>
              <View style={styles.profileSubContainer}>
                <Text style={styles.label}>
                  Business Name <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.businessNameContainer}>
                  <Text style={styles.businessNameText}>{useUser('name') || business?.name}</Text>
                </View>
              </View>
            </View>
            <View style={styles.rowContainer}>
              <Text>Primary Information</Text>
              <View style={styles.primaryInfoContainer}>

                <NavigationCardWithValue
                  mainIcon={
                    <MaterialIcons
                      name="phone"
                      size={icon(20)}
                      color={colors.primary}
                    />
                  }
                  title="Primary Number"
                  onpress={() => {}}
                  textFontSize={14}
                  disabled={true}
                  value={mobileNumber}
                  showIcon={false}
                />
                 {/* <NavigationCardWithValue
                  mainIcon={
                    <MaterialIcons
                      name="phone"
                      size={icon(20)}
                      color={colors.primary}
                    />
                  }
                  title="WhatsApp Number"
                  onpress={() => handleOpenModal({type: 'Phone Number'})}
                  textFontSize={14}
                  disabled={false}
                  value={mobileNumber}
                  isEdit={true}
                /> */}
                <NavigationCardWithValue
                  mainIcon={
                    <MaterialIcons
                      name="email"
                      size={icon(20)}
                      color={colors.primary}
                    />
                  }
                  title="Email Address"
                  onpress={() => {}}
                  textFontSize={14}
                  disabled={true}
                  value={userEmail || ''}
                  showIcon={false}
                />
                <NavigationCardWithValue
                  mainIcon={
                    <Lucide
                      name="layout-dashboard"
                      size={icon(20)}
                      color={colors.primary}
                    />
                  }
                  title="Business Category"
                  onpress={() => {
                    ToastAndroid.show(
                      'Business category changes are not allowed. Kindly contact the support team for assistance',
                      ToastAndroid.SHORT,
                    );
                  }}
                  textFontSize={14}
                  disabled={false}
                  value={
                    businessCategory.find(
                      item => item.id === business?.businessCategoryId,
                    )?.name
                  }
                  showIcon={false}
                />
              </View>
            </View>
            <View style={styles.rowContainer}>
              <Text>Business Information</Text>
                  <NavigationCardWithValue
                  mainIcon={
                    <MaterialIcons
                      name="label"
                      size={icon(20)}
                      color={colors.primary}
                    />
                  }
                  title="Prefix"
                  onpress={() => handleOpenModal({type: 'Prefix'})}
                  textFontSize={14}
                  disabled={false}
                  value={prefix}
                  isEdit={true}
                />
              <View style={styles.primaryInfoContainer}>
                <NavigationCardWithValue
                  mainIcon={
                    <Lucide
                      name="badge-percent"
                      size={icon(20)}
                      color={colors.primary}
                    />
                  }
                  title="GST Number"
                  textFontSize={14}
                  disabled={false}
                  value={gstNumber}
                  onpress={() => {
                    if (!business?.gstNumber) {
                      handleOpenModal({type: 'GST Number'});
                    } else {
                      ToastAndroid.show(
                        'GST number changes are not allowed. Kindly contact the support team for assistance',
                        ToastAndroid.SHORT,
                      );
                    }
                  }}
                  showIcon={!business?.gstNumber}
                  isEdit={true}
                />
                <NavigationCardWithValue
                  mainIcon={
                    <Ionicons
                      name="location-outline"
                      size={icon(20)}
                      color={colors.primary}
                    />
                  }
                  title="Street"
                  onpress={() => handleOpenModal({type: 'Street'})}
                  textFontSize={14}
                  disabled={false}
                  value={street}
                  isEdit={true}
                />
                <NavigationCardWithValue
                  mainIcon={
                    <MaterialIcons
                      name="location-city"
                      size={icon(20)}
                      color={colors.primary}
                    />
                  }
                  title="City"
                  onpress={() => handleOpenModal({type: 'City'})}
                  textFontSize={14}
                  disabled={false}
                  value={city}
                  isEdit={true}
                />
                <NavigationCardWithValue
                  mainIcon={
                    <MaterialIcons
                      name="confirmation-number"
                      size={icon(20)}
                      color={colors.primary}
                    />
                  }
                  title="Pincode"
                  onpress={() => handleOpenModal({type: 'Pincode'})}
                  textFontSize={14}
                  disabled={false}
                  value={pincode}
                  isEdit={true}
                />
                <NavigationCardWithValue
                  mainIcon={
                    <MaterialIcons
                      name="public"
                      size={icon(20)}
                      color={colors.primary}
                    />
                  }
                  title="State"
                  onpress={() => handleOpenModal({type: 'State'})}
                  textFontSize={14}
                  disabled={false}
                  value={state}
                  isEdit={true}
                />
              </View>
            </View>
          </ScrollView>
          {/* {!isModal && ( */}
          {/* <AnimatedPressable
            style={[styles.saveChangesContainer, {opacity: fadeAnim}]}
            onPress={handleSave}
            disabled={isSaveLoading}>
            {isSaveLoading ? (
              <ActivityIndicator size="small" color={'#fff'} />
            ) : (
              <Text style={styles.saveChangesText}>SAVE CHANGES</Text>
            )}
          </AnimatedPressable> */}
          {/* )} */}
          <CommonModal
            visible={isModal}
            handleClose={handleCloseModal}
            animationType="fade">
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change {modalType}</Text>
                <TouchableOpacity onPress={handleCloseModal}>
                  <Ionicons
                    name="close"
                    size={icon(24)}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
              <View
                style={{
                  borderBottomColor: '#ccc',
                  borderBottomWidth: 0.7,
                  marginTop: 10,
                }}
              />
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Enter Your {modalType}
                  <Text style={styles.required}>*</Text>
                </Text>
                {renderModalContent}
              </View>
              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaveLoading}
                style={styles.submitButton}>
                {isSaveLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>SUBMIT</Text>
                )}
              </TouchableOpacity>
            </View>
          </CommonModal>
        </Layout>
      </GestureHandlerRootView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 80,
  },
  rowContainer: {
    backgroundColor: '#fff',
    marginVertical: margin(16),
    padding: padding(16),
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap(16),
  },
  businessNameContainer: {
    width: '100%',
  },
  profileSubContainer: {
    flex: 1,
    gap: gap(8),
  },
  businessNameText: {
    color: '#000',
    fontSize: font(18),
    fontFamily: fonts.inBold,
  },
  required: {
    color: 'red',
  },
  label: {
    fontSize: font(14),
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  gradientBorder: {
    width: icon(70),
    height: icon(70),
    borderRadius: icon(70),
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: icon(64),
    height: icon(64),
    borderRadius: icon(64),
    backgroundColor: '#fff',
  },
  primaryInfoContainer: {
    marginVertical: gap(0),
  },
  modalContainer: {
    padding: padding(16),
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: font(14),
    fontFamily: fonts.inBold,
    color: '#000',
  },
  inputContainer: {
    marginVertical: gap(16),
    gap: gap(16),
  },
  submitButton: {
    alignSelf: 'center',
    marginTop: gap(16),
    paddingVertical: padding(10),
    paddingHorizontal: padding(16),
    backgroundColor: '#28A745',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: font(14),
    fontFamily: fonts.inBold,
    color: '#fff',
    letterSpacing: 1.5,
  },
  saveChangesContainer: {
    position: 'absolute',
    bottom: padding(40),
    paddingVertical: padding(10),
    paddingHorizontal: padding(16),
    alignSelf: 'center',
    backgroundColor: '#28A745',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveChangesText: {
    fontSize: font(14),
    fontFamily: fonts.inSemiBold,
    color: '#fff',
    letterSpacing: 1,
  },
  bottomSheetHeader: {
    height: icon(50),
    backgroundColor: colors.primary + 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: padding(15),
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontFamily: fonts.onSemiBold,
    color: colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F2F2F280',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.onRegular,
  },
  bottomSheetItem: {
    paddingHorizontal: 20,
  },
  bottomSheetContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  bottomSheetHeaderContainer: {
    marginBottom: margin(10),
    backgroundColor: '#fff',
  },
});

export default Business;
