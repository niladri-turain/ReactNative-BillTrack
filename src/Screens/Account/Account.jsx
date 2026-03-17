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

const Account = memo(() => {
  const userName = useUser('name');
  const userPhone = useUser('phone');
  const userEmail = useUser('email') || '';
  const logoUrl = useBusiness('logoUrl');
  const token = useAuthToken();
  const updateUserFields = useUpdateUserFields();
  const {clearAllProducts} = useProduct();
  const {clearPrinter} = usePrinter();
  const {resetSettings} = useAppSettings();
  const clearInvoice = useInvoice('clearInvoice');

  //STATE VARIABLES
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);

  // LOADING STATE
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // MODAL STATES
  const [isModalVisible, setModalVisible] = useState(false);

  const navigation = useNavigation();
  const {logout} = useAuth();

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
  };

  const updateDetails = async () => {
    if (name === userName && userEmail === email) {
      ToastService.show({
        message: 'No changes found',
        type: 'error',
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
      const data = await userService.updateUser({
        name: name,
        email: email,
        token: token,
      });
      if (data.status) {
        // ToastService.show({
        //   message: data.message,
        //   type: 'success',
        //   position: 'top',
        // });
        ToastAndroid.show(data.message, ToastAndroid.SHORT, ToastAndroid.TOP);
        updateUserFields({name: name, email: email});
        setModalVisible(false);
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
        backdropColor={'#0000005'}>
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
});

export default Account;
