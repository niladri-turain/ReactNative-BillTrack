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
import {useAuth, useAuthToken, useBusiness} from '../../Contexts/AuthContext';
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
  const [businessCategory, setBusinessCategory] = useState([]);

  // MODAL STATES
  const [isModal, setIsModal] = useState(false);
  const [modalType, setModalType] = useState('Phone Number');

  // STATE VARIABLES
  const [mobileNumber, setMobileNumber] = useState(business?.phone || '');
  const [email, setEmail] = useState(business?.email || '');
  const [gstNumber, setGstNumber] = useState(business?.gstNumber || '');
  const [street, setStreet] = useState(business?.street || '');
  const [city, setCity] = useState(business?.city || '');
  const [pincode, setPincode] = useState(business?.pinCode || '');
  const [state, setState] = useState(business?.state || '');
  const [prefix, setPrefix] = useState(business?.prefix || '');

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

  const handleOpenModal = ({type}) => {
    setModalType(type);
    setIsModal(true);
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
  }, [isModal]);

  const handleSave = async () => {
    if (!isChanged) {
      ToastService.show({
        message: 'No changes detected',
        type: 'info',
      });
      return;
    }

    if (!state) {
      ToastService.show({
        message: 'Please select state',
        type: 'error',
      });
      return;
    }

    if (!street) {
      ToastService.show({
        message: 'Please enter street',
        type: 'error',
      });
      return;
    }

    if (!city) {
      ToastService.show({
        message: 'Please enter city',
        type: 'error',
      });
      return;
    }

    if (!pincode) {
      ToastService.show({
        message: 'Please enter pincode',
        type: 'error',
      });
      return;
    }

    if (!prefix) {
      ToastService.show({
        message: 'Please enter prefix',
        type: 'error',
      });
      return;
    }

    if (prefix.length >= 6) {
      ToastService.show({
        message: 'Prefix should be less than 6 characters',
        type: 'error',
      });
      return;
    }

    if (mobileNumber && !validateIndianPhone(mobileNumber)) {
      ToastService.show({
        message: 'Invalid Phone Number',
        type: 'error',
      });
      return;
    }

    if (email && !validateEmail(email)) {
      ToastService.show({
        message: 'Invalid Email',
        type: 'error',
      });
      return;
    }

    if (gstNumber && !validateIndianGST(gstNumber)) {
      ToastService.show({
        message: 'Invalid GST Number',
        type: 'error',
      });
      return;
    }

    if (pincode && !validateIndianPincode(pincode)) {
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
          gstNumber: gstNumber,
          street: street,
          city: city,
          state: state,
          pinCode: pincode,
          email: email,
          phone: mobileNumber,
          prefix: prefix,
        });
        if (data.status) {
          ToastService.show({
            message: 'Business updated successfully',
            type: 'success',
          });
          const updatedBusiness = data?.business;
          await resetBusiness(updatedBusiness);
        }
      } catch (error) {
      } finally {
        setIsSaveLoading(false);
      }
    };

    if (gstNumber) {
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
            value={mobileNumber}
            setValue={setMobileNumber}
            keyboardType="numeric"
            maxLength={10}
            hasError={mobileNumber > 0 && !validateIndianPhone(mobileNumber)}
          />
        );
      case 'Email Address':
        return (
          <SimpleTextInput
            placeholder={`Enter Email Address`}
            value={email}
            setValue={setEmail}
            keyboardType="email-address"
            hasError={email && !validateEmail(email)}
          />
        );
      case 'GST Number':
        return (
          <SimpleTextInput
            placeholder={`Enter GST Number`}
            value={gstNumber}
            setValue={setGstNumber}
            keyboardType="default"
            hasError={gstNumber && !validateIndianGST(gstNumber)}
            upperCase={true}
            maxLength={15}
          />
        );
      case 'State':
        return (
          <SimpleTextInput
            label="Enter State"
            value={state}
            setValue={setState}
            keyboardType="default"
          />
        );
      case 'City':
        return (
          <SimpleTextInput
            label="Enter City"
            value={city}
            setValue={setCity}
            keyboardType="default"
          />
        );
      case 'Pincode':
        return (
          <SimpleTextInput
            label="Enter Pincode"
            value={pincode}
            setValue={setPincode}
            keyboardType="numeric"
            hasError={pincode && !validateIndianPincode(pincode)}
          />
        );
      case 'Street':
        return (
          <SimpleTextInput
            label="Enter Street"
            value={street}
            setValue={setStreet}
            keyboardType="default"
          />
        );
      case 'Prefix':
        return (
          <SimpleTextInput
            label="Enter Prefix"
            value={prefix}
            setValue={setPrefix}
            keyboardType="default"
            maxLength={6}
            upperCase={true}
          />
        );
      default:
        return null;
    }
  }, [
    modalType,
    mobileNumber,
    email,
    gstNumber,
    state,
    city,
    pincode,
    street,
    prefix,
  ]);

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
                  <Text style={styles.businessNameText}>{business?.name}</Text>
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
                  title="Prefix"
                  onpress={() => handleOpenModal({type: 'Prefix'})}
                  textFontSize={14}
                  disabled={false}
                  value={prefix}
                />
                <NavigationCardWithValue
                  mainIcon={
                    <MaterialIcons
                      name="phone"
                      size={icon(20)}
                      color={colors.primary}
                    />
                  }
                  title="Phone Number"
                  onpress={() => handleOpenModal({type: 'Phone Number'})}
                  textFontSize={14}
                  disabled={false}
                  value={mobileNumber}
                />
                <NavigationCardWithValue
                  mainIcon={
                    <MaterialIcons
                      name="email"
                      size={icon(20)}
                      color={colors.primary}
                    />
                  }
                  title="Email Address"
                  onpress={() => handleOpenModal({type: 'Email Address'})}
                  textFontSize={14}
                  disabled={false}
                  value={email}
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
                />
              </View>
            </View>
            <View style={styles.rowContainer}>
              <Text>Business Information</Text>
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
                />
              </View>
            </View>
          </ScrollView>
          {/* {!isModal && ( */}
          <AnimatedPressable
            style={[styles.saveChangesContainer, {opacity: fadeAnim}]}
            onPress={handleSave}
            disabled={isSaveLoading}>
            {isSaveLoading ? (
              <ActivityIndicator size="small" color={'#fff'} />
            ) : (
              <Text style={styles.saveChangesText}>SAVE CHANGES</Text>
            )}
          </AnimatedPressable>
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
                onPress={handleCloseModal}
                style={styles.submitButton}>
                <Text style={styles.submitButtonText}>SUBMIT</Text>
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
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: padding(16),
    paddingVertical: padding(14),
  },
  profileSubContainer: {
    flex: 1,
    gap: gap(8),
  },
  businessNameText: {
    color: '#00000090',
    fontSize: font(14),
    fontWeight: '500',
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
    marginVertical: gap(10),
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
