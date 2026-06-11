import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {memo, useState} from 'react';
import {Layout} from '../Layout';
import {
  ProfileCard,
  SecondaryHeader,
  SettingItemsCard,
  SimpleTextInput,
} from '../../Components';
import {colors} from '../../utils/colors';
import {fonts} from '../../utils/fonts';
import {font, gap, icon, margin, padding} from '../../utils/responsive';
import Lucide from '@react-native-vector-icons/lucide';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import AntDesign from '@react-native-vector-icons/ant-design';
import {useNavigation} from '@react-navigation/native';
import {
  updateUserFields,
  useAuth,
  useAuthToken,
  useBusiness,
  useUpdateUserFields,
  useUser,
} from '../../Contexts/AuthContext';
import Ionicons from '@react-native-vector-icons/ionicons';
import {validateEmail, validateName} from '../../utils/validator';
import ToastService from '../../Components/Toasts/ToastService';
import {userService} from '../../Services/UserService';
import {useProduct} from '../../Contexts/ProductContexts';
import {usePrinter} from '../../Contexts/PrinterContext';
import {useAppSettings} from '../../Contexts/AppSettingContexts';
import {useInvoice} from '../../Contexts/InvoiceContext';
import {API_URL} from '../../utils/config';
import ImageCropPicker from 'react-native-image-crop-picker';

const Account = memo(() => {
  const userName = useUser('name');
  const userPhone = useUser('phone');
  const userEmail = useUser('email') || '';
  const logoUrl = useBusiness('logoUrl');
  const token = useAuthToken();
  const {logout, resetBusiness} = useAuth();
  const updateUserFields = useUpdateUserFields()
  const {clearAllProducts} = useProduct();
  const {clearPrinter} = usePrinter();
  const {resetSettings} = useAppSettings();
  const clearInvoice = useInvoice('clearInvoice');

  //STATE VARIABLES
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [newImage, setNewImage] = useState(null);

  // LOADING STATE
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // MODAL STATES
  const [isModalVisible, setModalVisible] = useState(false);

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
    setName(userName);
    setEmail(userEmail);
  };

  const handleImagePick = () => {
    ImageCropPicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
      cropperCircleOverlay: true,
      mediaType: 'photo',
    })
      .then(image => {
        setNewImage(image);
      })
      .catch(err => {
        if (err.code !== 'E_PICKER_CANCELLED') {
          ToastAndroid.show('Could not select image', ToastAndroid.SHORT);
        }
      });
  };

  const updateDetails = async () => {
    if (name === userName && userEmail === email && !newImage) {
      ToastService.show({
        message: 'No changes found',
        type: 'info',
        position: 'top',
      });
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
        token: token,
      };
      if (newImage) {
        payload.avatar = {
          uri: newImage.path,
          type: newImage.mime,
          name: newImage.filename || `profile_${Date.now()}.jpg`,
        };
      }
      const data = await userService.updateUser(payload);
      if (data.status) {
        ToastAndroid.show(data.message, ToastAndroid.SHORT, ToastAndroid.TOP);
        updateUserFields({name: name, email: email});
        if (data.business) {
          resetBusiness(data.business);
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
          onpressEditBtn={() => setModalVisible(true)}
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
               <Ionicons name="trash-outline" size={icon(22)} color={colors.primary} />
               
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
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}>
        <Pressable onPress={handleCloseModal} style={styles.modalContainer}>
          <Pressable
            onPress={event => event.stopPropagation()}
            style={styles.modalContentContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitleText}>
                Update Profile Details
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={icon(20)} color="#00000090" />
              </TouchableOpacity>
            </View>
            <View style={styles.imageUploadContainer}>
              <Image
                source={
                  newImage
                    ? {uri: newImage.path}
                    : {uri: `${API_URL}files/logo/${logoUrl}`}
                }
                style={styles.modalImage}
              />
              <TouchableOpacity
                onPress={handleImagePick}
                style={styles.changeImageButton}>
                <Text style={styles.changeImageButtonText}>
                  Change Profile Image
                </Text>
              </TouchableOpacity>
            </View>
            <SimpleTextInput
              placeholder="Name"
              value={name}
              setValue={setName}
              hasError={name.length > 0 && !validateName(name)}
            />
            <SimpleTextInput
              placeholder="Email(optional)"
              value={email}
              setValue={setEmail}
              hasError={email && !validateEmail(email)}
            />
            <Pressable style={styles.updateBtn} onPress={updateDetails}>
              {isUpdateLoading ? (
                <ActivityIndicator color={'#fff'} size={'small'} />
              ) : (
                <Text style={styles.updateBtnText}>UPDATE</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
    borderRadius: 5,
    padding: padding(16),
    gap: gap(15),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderTitleText: {
    fontSize: font(12),
    fontFamily: fonts.inRegular,
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
});

export default Account;
