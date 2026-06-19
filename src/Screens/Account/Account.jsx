import {
  ActivityIndicator,
  Image,
  Modal,
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
import React, {memo, useState, useEffect, useRef} from 'react';
import {Layout} from '../Layout';
import {
  ProfileCard,
  SecondaryHeader,
  SettingItemsCard,
  SimpleTextInput,
  CommonModal,
} from '../../Components';
import {colors} from '../../utils/colors';
import {fonts} from '../../utils/fonts';
import {font, gap, icon, margin, padding} from '../../utils/responsive';
import Lucide from '@react-native-vector-icons/lucide';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import AntDesign from '@react-native-vector-icons/ant-design';
import {useNavigation} from '@react-navigation/native';
import {
  useAuth,
  useAuthToken,
  useBusiness,
  useUpdateUserFields,
  useUpdateBusinessFields,
  useUser,
} from '../../Contexts/AuthContext';
import Ionicons from '@react-native-vector-icons/ionicons';
import {validateEmail, validateIndianPhone, validateName} from '../../utils/validator';
import ToastService from '../../Components/Toasts/ToastService';
import {userService} from '../../Services/UserService';
import {authService} from '../../Services/AuthService';
import {businessService} from '../../Services/BusinessService';
import {useProduct} from '../../Contexts/ProductContexts';
import {usePrinter} from '../../Contexts/PrinterContext';
import {useAppSettings} from '../../Contexts/AppSettingContexts';
import {useInvoice} from '../../Contexts/InvoiceContext';
import {API_URL} from '../../utils/config';
import ImageCropPicker from 'react-native-image-crop-picker';

const Account = memo(() => {
  const businessName = useBusiness('name');
  const _userName = useUser('name');
  const userName = _userName || businessName;

  const businessPhone = useBusiness('phone');
  const _userPhone = useUser('phone');
  const userPhone = _userPhone || businessPhone;

  const businessEmail = useBusiness('email');
  const _userEmail = useUser('email');
  const userEmail = _userEmail || businessEmail || '';
  const userId = useUser('id');
  const logoUrl = useBusiness('logoUrl');
  const token = useAuthToken();
  const {logout, resetBusiness} = useAuth();
  const updateUserFields = useUpdateUserFields();
  const updateBusinessFields = useUpdateBusinessFields();
  const {clearAllProducts} = useProduct();
  const {clearPrinter} = usePrinter();
  const {resetSettings} = useAppSettings();
  const clearInvoice = useInvoice('clearInvoice');

  //STATE VARIABLES
  const [name, setName] = useState(userName);
  const [phone, setPhone] = useState(userPhone);
  const [email, setEmail] = useState(userEmail);
  const [newImage, setNewImage] = useState(null);
  const [updateError, setUpdateError] = useState('');

  // OTP STATES
  const [otp, setOtp] = useState(['', '', '', '']);
  const [showOtpFields, setShowOtpFields] = useState(false);
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);
  const [otpSentMessage, setOtpSentMessage] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    let interval;
    if (showOtpFields && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpFields, timer]);

  useEffect(() => {
    setName(userName);
  }, [userName]);

  useEffect(() => {
    setPhone(userPhone);
  }, [userPhone]);

  useEffect(() => {
    setEmail(userEmail);
  }, [userEmail]);

  // LOADING STATE
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // MODAL STATES
  const [isModalVisible, setModalVisible] = useState(false);

  const otpInputs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await logout();
      await clearAllProducts();
      await clearPrinter();
      await resetSettings();
      clearInvoice();
    } catch (error) {
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleNavigation = ({screen, data = {}}) => {
    navigation.navigate(screen, {
      data,
    });
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setNewImage(null);
    setUpdateError('');
    setShowOtpFields(false);
    setOtp(['', '', '', '']);
    setOtpSentMessage('');
    setPhoneError('');
    setTimer(60);
  };

  const handleImagePick = () => {
    ImageCropPicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
      cropperCircleOverlay: true,
      mediaType: 'photo',
    })
      .then(async image => {
        setIsImageUploading(true);
        try {
          const extension = image.mime.split('/')[1] || 'jpg';
          const randomString = Math.random().toString(36).substring(2, 9);
          const newFilename = `${Date.now()}_${randomString}.${extension}`;
          const profileImagePayload = {
            uri: image.path,
            type: image.mime,
            name: newFilename,
          };
          const data = await userService.updateUserProfileImage({
            profileImage: profileImagePayload,
            token: token,
          });

          if (data.status) {
            ToastAndroid.show(data.message, ToastAndroid.SHORT);
            if (data.business) {
              resetBusiness(data.business);
            } else {
              updateBusinessFields({logoUrl: data.logoUrl || data.logo || logoUrl});
            }
            setNewImage(image);
          } else {
            ToastAndroid.show(
              data.message || 'Failed to upload image',
              ToastAndroid.SHORT,
            );
          }
        } catch (error) {
          ToastAndroid.show(
            'An error occurred during image upload.',
            ToastAndroid.SHORT,
          );
        } finally {
          setIsImageUploading(false);
        }
      })
      .catch(err => {
        if (err.code !== 'E_PICKER_CANCELLED') {
          ToastAndroid.show('Could not select image', ToastAndroid.SHORT);
        }
      });
  };

  const updateDetails = async () => {
    setUpdateError('');
    if (name === userName && userEmail === email && userPhone === phone) {
      setUpdateError('No changes found');
      return;
    }
    if (!name || !validateName(name)) {
      ToastService.show({
        message: 'Enter a valid name',
        type: 'error',
        position: 'top',
      });
      return;
    }

    if (phone && !validateIndianPhone(phone)) {
      ToastService.show({
        message: 'Enter a valid phone number',
        type: 'error',
        position: 'top',
      });
      return;
    }

    if (email && !validateEmail(email)) {
      ToastService.show({
        message: 'Enter a valid email',
        type: 'error',
        position: 'top',
      });
      return;
    }

    try {
      setIsUpdateLoading(true);
      const payload = {
        name: name,
        email: email,
        phone: phone,
        token: token,
      };
      const data = await userService.updateUser(payload);

      // Also update business name
      const businessPayload = {
        token: token,
        name: name,
        phone: phone,
      };
      await businessService.updateBusiness(businessPayload);

      if (data.status) {
        ToastAndroid.show(data.message, ToastAndroid.SHORT, ToastAndroid.TOP);
        updateUserFields({name: name, email: email, phone: phone});

        if (data.business) {
          resetBusiness({...data.business, name: name, phone: phone});
        } else {
          updateBusinessFields({name: name, phone: phone});
        }

        handleCloseModal();
      } else {
        ToastService.show({
          message: data.message,
          type: 'error',
          position: 'top',
        });
      }
    } catch (error) {
      ToastService.show({
        message: 'Something went wrong',
        type: 'error',
        position: 'top',
      });
    } finally {
      setIsUpdateLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone || !validateIndianPhone(phone)) {
      ToastService.show({
        message: 'Enter a valid phone number',
        type: 'error',
        position: 'top',
      });
      return;
    }

    try {
      setIsVerifyLoading(true);
      const data = await authService.changePhone(userId, phone);
      if (data.status) {
        setOtpSentMessage(data.message);
        setShowOtpFields(true);
        setPhoneError('');
        setTimer(60);
        setOtp(['', '', '', '']);
      } else {
        setPhoneError(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      setPhoneError('Something went wrong while sending OTP');
    } finally {
      setIsVerifyLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join('');
    setPhoneError('');
    if (enteredOtp.length !== 4) {
      setPhoneError('Enter a valid 4-digit OTP');
      return;
    }

    try {
      setIsVerifyLoading(true);
      const data = await authService.verifyPhone(userId, enteredOtp);
      if (data.status) {
        ToastAndroid.show(data.message, ToastAndroid.SHORT);
        updateUserFields({phone: phone});
        updateBusinessFields({phone: phone});
        handleCloseModal();
      } else {
        setPhoneError(data.message || 'OTP verification failed');
      }
    } catch (error) {
      setPhoneError('Something went wrong during verification');
    } finally {
      setIsVerifyLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (value && !/^\d+$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 3) {
      otpInputs[index + 1].current.focus();
    }
  };

  return (
    <Layout>
      <SecondaryHeader title="Account Setting" isSearch={false} />
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{
          backgroundColor: '#fff',
          paddingBottom: 50,
        }}>
        <ProfileCard
          userName={userName}
          userPhone={userPhone}
          logoUrl={logoUrl}
          onpressEditBtn={() => {
            setName(userName);
            setPhone(userPhone);
            setEmail(userEmail);
            setUpdateError('');
            setModalVisible(true);
          }}
        />
        <View style={styles.container}>
          <Pressable
            style={styles.card}
            onPress={() => handleNavigation({screen: 'SalesAndReport'})}>
            <Image
              source={require('./../../../asset/images/product_icon.png')}
              style={styles.image}
              resizeMode="contain"
            />
            <Text style={styles.text}>Sales report</Text>
          </Pressable>
          <Pressable
            style={styles.card}
            onPress={() => handleNavigation({screen: 'ActiveProducts'})}>
            <Image
              source={require('./../../../asset/images/sales_icon.png')}
              style={styles.image}
              resizeMode="contain"
            />
            <Text style={styles.text}>Active Products</Text>
          </Pressable>
        </View>
        <View style={styles.settingContainer}>
          <Text style={styles.settingTitleText}>Settings</Text>
          <SettingItemsCard
            onpress={() => handleNavigation({screen: 'Business'})}
            mainIcon={
              <Lucide
                name="user"
                size={icon(22)}
                color={colors.primary}
              />
            }
            title="Account Profile"
          />
          <SettingItemsCard
            onpress={() => handleNavigation({screen: 'ItemMaster'})}
            mainIcon={
              <Lucide
                name="baggage-claim"
                size={icon(22)}
                color={colors.primary}
              />
            }
            title="Item master"
          />
          <SettingItemsCard
            onpress={() => handleNavigation({screen: 'Subscription'})}
            mainIcon={
              <Lucide name="crown" size={icon(22)} color={colors.primary} />
            }
            title="Subscriptions"
          />
          <SettingItemsCard
            onpress={() => handleNavigation({screen: 'Transaction'})}
            mainIcon={
              <Lucide
                name="arrow-right-left"
                size={icon(22)}
                color={colors.primary}
              />
            }
            title="Transaction"
          />
          <SettingItemsCard
            mainIcon={
              <MaterialIcons
                name="settings"
                size={icon(22)}
                color={colors.primary}
              />
            }
            title="Settings"
            tag
            tagText="New"
            onpress={() => handleNavigation({screen: 'Settings'})}
          />
          <SettingItemsCard
            mainIcon={
              <Lucide name="headset" size={icon(22)} color={colors.primary} />
            }
            title="Help & supports"
            onpress={() => handleNavigation({screen: 'HelpAndSupport'})}
          />
          <SettingItemsCard
            mainIcon={
              <AntDesign
                name="exclamation-circle"
                size={icon(22)}
                color={colors.primary}
              />
            }
            title="About Billtrack"
            onpress={() => handleNavigation({screen: 'About'})}
          />
           <SettingItemsCard
            mainIcon={
              // <AntDesign
              //   name="invoice"
              //   size={icon(22)}
              //   color={colors.primary}
              // />
              <Ionicons name="close-circle-outline" size={icon(28)} color={colors.primary} />

            }
            title="Cancel Invoice List"
            onpress={() => handleNavigation({screen: 'CancelInvoiceList'})}
          />
          <SettingItemsCard
            mainIcon={
              <MaterialIcons
                name="logout"
                size={icon(22)}
                color={colors.primary}
              />
            }
            title={logoutLoading ? 'Logging out...' : 'Logout'}
            onpress={handleLogout}
            disabled={logoutLoading}
          />
        </View>
        {/* <View style={styles.deleteContainer}>
          <MaterialIcons
            name="delete-outline"
            size={icon(22)}
            color={colors.error}
          />
          <Text style={styles.deleteText}>Delete Account</Text>
        </View> */}
      </ScrollView>
      <CommonModal
        visible={isModalVisible}
        handleClose={handleCloseModal}
        animationType="slide">
        <View style={styles.modalContentContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitleText}>
              Update Profile Details
            </Text>
            <TouchableOpacity onPress={handleCloseModal}>
              <Ionicons name="close" size={icon(24)} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View
            style={{
              borderBottomColor: '#ccc',
              borderBottomWidth: 0.7,
              marginTop: 10,
              marginBottom: 10,
            }}
          />
          <View style={styles.imageUploadContainer}>
            <View>
              <Image
                source={
                  newImage
                    ? {uri: newImage.path}
                    : {uri: `${API_URL}files/logo/${logoUrl}`}
                }
                style={styles.modalImage}
              />
              {isImageUploading && (
                <View style={styles.imageOverlay}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={handleImagePick}
              style={styles.changeImageButton}
              disabled={isImageUploading}>
              <Text style={styles.changeImageButtonText}>
                {isImageUploading ? 'Uploading...' : 'Change Profile Image'}
              </Text>
            </TouchableOpacity>
          </View>
          <SimpleTextInput
            placeholder="Name"
            value={name}
            setValue={setName}
            hasError={name.length > 0 && !validateName(name)}
          />
          <View>
            <View style={{position: 'relative'}}>
              <SimpleTextInput
                placeholder="Phone Number"
                value={phone}
                setValue={val => {
                  setPhone(val);
                  setPhoneError('');
                }}
                keyboardType="number-pad"
                maxLength={10}
                hasError={phone && !validateIndianPhone(phone)}
              />
              {phone !== userPhone &&
                validateIndianPhone(phone) &&
                !showOtpFields && (
                  <TouchableOpacity
                    onPress={handleSendOtp}
                    style={styles.verifyButtonInline}>
                    {isVerifyLoading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text style={styles.verifyButtonInlineText}>VERIFY</Text>
                    )}
                  </TouchableOpacity>
                )}
            </View>
            {!showOtpFields && phoneError ? (
              <Text style={styles.fieldErrorText}>{phoneError}</Text>
            ) : null}
          </View>

          {showOtpFields && (
            <View style={styles.otpSection}>
              <Text style={styles.otpLabel}>{otpSentMessage}</Text>
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={otpInputs[index]}
                    style={styles.otpInput}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={value => handleOtpChange(value, index)}
                    onKeyPress={({nativeEvent}) => {
                      if (
                        nativeEvent.key === 'Backspace' &&
                        !otp[index] &&
                        index > 0
                      ) {
                        otpInputs[index - 1].current.focus();
                      }
                    }}
                  />
                ))}
              </View>
              {timer > 0 ? (
                <Text style={styles.timerText}>
                  Resend OTP in 00:{timer < 10 ? `0${timer}` : timer}
                </Text>
              ) : null}
              {phoneError ? (
                <Text
                  style={[
                    styles.fieldErrorText,
                    {textAlign: 'center', paddingHorizontal: 0},
                  ]}>
                  {phoneError}
                </Text>
              ) : null}
              {timer > 0 ? (
                <TouchableOpacity
                  style={styles.verifyOtpBtn}
                  onPress={handleVerifyOtp}
                  disabled={isVerifyLoading}>
                  {isVerifyLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.verifyOtpBtnText}>Verify OTP</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.resendOtpBtn}
                  onPress={handleSendOtp}
                  disabled={isVerifyLoading}>
                  {isVerifyLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.resendOtpBtnText}>Resend OTP</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          <SimpleTextInput
            placeholder="Email(optional)"
            value={email}
            setValue={setEmail}
            hasError={email && !validateEmail(email)}
          />
          {updateError ? (
            <Text style={styles.errorText}>{updateError}</Text>
          ) : null}
          <Pressable style={styles.updateBtn} onPress={updateDetails}>
            {isUpdateLoading ? (
              <ActivityIndicator color={'#fff'} size={'small'} />
            ) : (
              <Text style={styles.updateBtnText}>UPDATE</Text>
            )}
          </Pressable>
        </View>
      </CommonModal>
    </Layout>
  );
});

const styles = StyleSheet.create({
  container: {
    // backgroundColor: '#fff',
    paddingHorizontal: padding(16),
    paddingVertical: padding(24),
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  card: {
    width: '48%',
    paddingVertical: padding(16),
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    paddingHorizontal: padding(16),
    gap: 16,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: colors.border,
  },
  image: {
    width: icon(24),
    height: icon(24),
  },
  text: {
    fontSize: font(14),
    fontFamily: fonts.popMedium,
    color: '#000',
  },
  settingContainer: {
    paddingHorizontal: padding(16),
    paddingVertical: padding(24),
  },
  settingTitleText: {
    fontSize: font(16),
    fontFamily: fonts.popRegular,
    color: '#6C6C6C',
  },
  deleteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap(16),
    paddingVertical: padding(18),
    paddingHorizontal: padding(16),
    backgroundColor: colors.error + 20,
  },
  deleteText: {
    fontSize: font(14),
    fontFamily: fonts.popMedium,
    color: colors.error,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: padding(16),
  },
  modalContentContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: padding(16),
    gap: gap(15),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderTitleText: {
    fontSize: font(14),
    fontFamily: fonts.popSemiBold,
    color: '#000',
  },
  updateBtn: {
    backgroundColor: colors.primary,
    paddingVertical: padding(10),
    marginVertical: margin(10),
    borderRadius: 5,
    alignItems: 'center',
  },
  updateBtnText: {
    fontSize: font(12),
    fontFamily: fonts.inMedium,
    color: '#fff',
  },
  imageUploadContainer: {
    alignItems: 'center',
    gap: gap(10),
  },
  modalImage: {
    width: icon(100),
    height: icon(100),
    borderRadius: icon(50),
    borderWidth: 2,
    borderColor: colors.primary,
  },
  changeImageButton: {
    paddingVertical: padding(5),
    paddingHorizontal: padding(10),
    backgroundColor: colors.primary + '20',
    borderRadius: 5,
  },
  changeImageButtonText: {
    color: colors.primary,
    fontFamily: fonts.inMedium,
    fontSize: font(12),
  },
  imageOverlay: {
    position: 'absolute',
    width: icon(100),
    height: icon(100),
    borderRadius: icon(50),
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: font(12),
    fontFamily: fonts.inRegular,
    marginTop: -margin(5),
    textAlign: 'center',
  },
  fieldErrorText: {
    color: colors.error,
    fontSize: font(10),
    fontFamily: fonts.inRegular,
    paddingHorizontal: padding(16),
    marginTop: margin(2),
  },
  verifyButtonInline: {
    position: 'absolute',
    right: 50,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  verifyButtonInlineText: {
    color: colors.primary,
    fontFamily: fonts.popBold,
    fontSize: font(12),
  },
  otpSection: {
    gap: gap(10),
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: font(10),
    fontFamily: fonts.inRegular,
    color: colors.sucess,
  },
  otpContainer: {
    flexDirection: 'row',
    gap: gap(10),
    justifyContent: 'center',
  },
  otpInput: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 5,
    textAlign: 'center',
    fontSize: font(16),
    fontFamily: fonts.popSemiBold,
    color: '#000',
  },
  verifyOtpBtn: {
    backgroundColor: colors.primary,
    paddingVertical: padding(8),
    paddingHorizontal: padding(20),
    borderRadius: 5,
  },
  verifyOtpBtnText: {
    color: '#fff',
    fontFamily: fonts.inMedium,
    fontSize: font(12),
  },
  timerText: {
    fontSize: font(12),
    fontFamily: fonts.popRegular,
    color: '#6C6C6C',
  },
  resendOtpBtn: {
    paddingVertical: padding(8),
    paddingHorizontal: padding(20),
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  resendOtpBtnText: {
    color: colors.primary,
    fontFamily: fonts.inMedium,
    fontSize: font(12),
  },
});

export default Account;
