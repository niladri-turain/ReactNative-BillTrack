import {
  ActivityIndicator,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {AuthLayout} from '../Layout';
import {SimpleTextInput, StepGuide} from '../../Components';
import {fonts} from '../../utils/fonts';
import {colors} from '../../utils/colors';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageCropPicker from 'react-native-image-crop-picker';
import {font, gap, icon, margin, padding} from '../../utils/responsive';
import {validateIndianPincode} from '../../utils/validator';
import ToastService from '../../Components/Toasts/ToastService';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {RotateOutDownLeft} from 'react-native-reanimated';
import {businessService} from '../../Services/BusinessService';
import {useAuth, useAuthToken} from '../../Contexts/AuthContext';
import {requestPermission} from '../../utils/helper';
import {getDeviceDetails} from '../../utils/DeviceInfo';

import {userService} from '../../Services/UserService';
import {stateService} from '../../Services/StateService';

const BusinessSetup2 = () => {
  const navigation = useNavigation();
  const token = useAuthToken();
  const {setUserData, setBusinessData, user} = useAuth();
  const route = useRoute();
  const {businessName, businessType, email, gstNumber, phone} = route.params;
  const [image, setImage] = useState(null);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [isStateModalVisible, setIsStateModalVisible] = useState(false);
  const [pincode, setPincode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isStatesLoading, setIsStatesLoading] = useState(false);

  useEffect(() => {
    const fetchStates = async () => {
      setIsStatesLoading(true);
      try {
        const response = await stateService.getStates(token);
        if (response?.status && Array.isArray(response.data)) {
          setStates(response.data);
        } else {
          ToastService.show({
            message: response?.message || 'Unable to load states',
            type: 'error',
            position: 'top',
          });
        }
      } catch (error) {
        ToastService.show({
          message: 'Unable to load states',
          type: 'error',
          position: 'top',
        });
      } finally {
        setIsStatesLoading(false);
      }
    };
    fetchStates();
  }, [token]);

  // Step Guide
  const [guideVisible, setGuideVisible] = useState(false);
  const [targetLayout, setTargetLayout] = useState(null);
  const proceedButtonRef = React.useRef(null);

  useEffect(() => {
    const checkGuide = async () => {
      if (await AsyncStorage.getItem('skipAllStepGuides')) return;
      const hasSeen = await AsyncStorage.getItem('hasSeenBusinessSetup2Guide');
      if (!hasSeen) {
        setTimeout(() => {
          proceedButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
            setTargetLayout({x: pageX, y: pageY, width, height});
            setGuideVisible(true);
          });
        }, 1000);
      }
    };
    checkGuide();
  }, []);

  const closeGuide = async () => {
    setGuideVisible(false);
    await AsyncStorage.setItem('hasSeenBusinessSetup2Guide', 'true');
  };

  const handleImagePickcker = async () => {
    // const hasPermission = await requestPermission();
    // if (!hasPermission) {
    //   ToastAndroid.show('Permission denied', ToastAndroid.SHORT);
    //   return;
    // }
    ImageCropPicker.openPicker({
      width: 200,
      height: 200,
      cropping: true,
      avoidEmptySpaceAroundImage: true,
      mediaType: 'photo',
    }).then(image => {
      setImage(image);
    });
  };

  const handleProceed = async () => {
    if (!image) {
      ToastService.show({
        message: 'Upload Business Logo',
        type: 'error',
        position: 'top',
      });
      return;
    } else if (pincode.length !== 6) {
      ToastService.show({
        message: 'Enter Valid Pincode',
        type: 'error',
        position: 'top',
      });
      return;
    } else if (street.length === 0) {
      ToastService.show({
        message: 'Enter Street Address',
        type: 'error',
        position: 'top',
      });
      return;
    } else if (city.length === 0) {
      ToastService.show({
        message: 'Enter City',
        type: 'error',
        position: 'top',
      });
      return;
    } else if (!selectedState) {
      ToastService.show({
        message: 'Enter State',
        type: 'error',
        position: 'top',
      });
      return;
    }

    try {
      setIsLoading(true);
      const deviceInfo = await getDeviceDetails();
      const data = await businessService.createBusiness({
        name: businessName,
        businessCategoryId: businessType,
        city: city,
        email: email,
        gstNumber: gstNumber,
        logo: {
          uri: image.path,
          type: image.mime,
          name: image.filename,
        },
        phone: phone,
        pincode: pincode,
        stateId: selectedState.id,
        street: street,
        token: token,
        deviceInfo: deviceInfo,
      });
      if (data?.status) {
        const businessData = await businessService.getBusiness(token);
        const newUser = {...user, businessId: businessData?.data?.id, name: businessName};
        await setUserData(newUser);
        await userService.updateUser({name: businessName, token: token});
        const business = businessData?.data;
        await setBusinessData(business);
        // navigation.reset({
        //   index: 0,
        //   routes: [
        //     {
        //       name: 'Product',
        //       state: {
        //         routes: [{name: 'ItemMaster'}],
        //       },
        //     },
        //   ],
        // });
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Product',
            },
          ],
        });
        ToastService.show({
          message: data.message,
          type: 'success',
          position: 'top',
        });
      } else {
        ToastService.show({
          message: data.message,
          type: 'error',
          position: 'top',
        });
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}> */}
      <ScrollView style={{flex: 1}} contentContainerStyle={styles.container}>
        <Image
          style={styles.image}
          source={require('./../../../asset/images/business.png')}
          resizeMode="contain"
        />
        <Text style={styles.title}>Set Up Your Business</Text>
        <View style={styles.logoContainer}>
          <Image
            source={
              image
                ? {
                    uri: image?.path,
                  }
                : require('./../../../asset/images/businessLogo.png')
            }
            style={styles.logo}
            resizeMode="contain"
          />

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleImagePickcker}>
            <MaterialIcons
              name="file-upload"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.uploadText}>Upload Logo</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputContainer}>

           <SimpleTextInput
            placeholder="Street"
            maxLength={50}
            value={street}
            setValue={setStreet}
            hasError={street.length > 0 && street.length < 3}
          />
          <SimpleTextInput
            placeholder="Pincode"
            keyboardType="numeric"
            maxLength={6}
            value={pincode}
            setValue={setPincode}
            hasError={pincode.length > 0 && !validateIndianPincode(pincode)}
          />



          <SimpleTextInput
            placeholder="City"
            maxLength={50}
            value={city}
            setValue={setCity}
            hasError={city.length > 0 && city.length < 3}
          />

          <TouchableOpacity
            style={styles.stateSelect}
            onPress={() => setIsStateModalVisible(true)}
            disabled={isStatesLoading}>
            <Text style={[styles.stateSelectText, !selectedState && styles.statePlaceholder]}>
              {isStatesLoading ? 'Loading states...' : selectedState?.name || 'Select state'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#777" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          ref={proceedButtonRef}
          style={styles.button}
          onPress={handleProceed}>
          {isLoading ? (
            <ActivityIndicator size={'small'} color={'#fff'} />
          ) : (
            <Text style={styles.buttonText}>PROCEED</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={isStateModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsStateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.stateModal}>
            <Text style={styles.modalTitle}>Select state</Text>
            <FlatList
              data={states}
              keyExtractor={item => String(item.id)}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.stateOption}
                  onPress={() => {
                    setSelectedState(item);
                    setIsStateModalVisible(false);
                  }}>
                  <Text style={styles.stateOptionText}>{item.name}</Text>
                  {selectedState?.id === item.id && (
                    <MaterialIcons name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyStates}>No states available</Text>}
            />
          </View>
        </View>
      </Modal>

      <StepGuide
        visible={guideVisible}
        onClose={closeGuide}
        targetLayout={targetLayout}
        text="complete business setup"
        arrowPosition="bottom"
      />
      {/* </KeyboardAvoidingView> */}
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap(10),
  },
  image: {
    width: icon(250),
    height: icon(120),
  },
  title: {
    fontSize: font(24),
    fontFamily: fonts.onBold,
    color: '#000',
  },
  inputContainer: {
    width: '100%',
    paddingHorizontal: padding(25),
    marginVertical: margin(15),
    gap: gap(15),
  },
  button: {
    width: icon(130),
    height: icon(40),
    borderRadius: 5,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: margin(5),
  },
  logoContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap(10),
    marginVertical: margin(5),
  },
  logo: {
    width: icon(100),
    height: icon(100),
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: icon(100) / 2,
  },
  buttonText: {
    fontSize: font(16),
    fontFamily: fonts.onSemiBold,
    color: '#fff',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + 30,
    width: icon(130),
    height: icon(40),
    gap: gap(5),
  },
  uploadText: {
    fontSize: font(14),
    fontFamily: fonts.onMedium,
    color: colors.primary,
  },
  stateSelect: {
    minHeight: icon(50),
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#fff',
    paddingHorizontal: padding(15),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stateSelectText: {
    flex: 1,
    fontSize: font(16),
    fontFamily: fonts.onRegular,
    color: '#222',
  },
  statePlaceholder: {color: '#aaa'},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  stateModal: {
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: padding(20),
    paddingTop: padding(18),
    paddingBottom: padding(25),
  },
  modalTitle: {
    fontSize: font(18),
    fontFamily: fonts.onSemiBold,
    color: '#111',
    marginBottom: margin(10),
  },
  stateOption: {
    minHeight: icon(48),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  stateOptionText: {fontSize: font(15), color: '#222'},
  emptyStates: {paddingVertical: padding(20), color: '#777', textAlign: 'center'},
});

export default BusinessSetup2;
