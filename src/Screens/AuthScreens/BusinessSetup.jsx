import {
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AuthLayout} from '../Layout';
import {fonts} from '../../utils/fonts';
import {
  BottomSheetInput,
  CustomToast,
  DottedDivider,
  RadioInput,
  SearchInput,
  SimpleTextInput,
} from '../../Components';
import {
  validateBusinessName,
  validateEmail,
  validateIndianGST,
  validateIndianPhone,
} from '../../utils/validator';
import {colors} from '../../utils/colors';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from '@gorhom/bottom-sheet';
import Ionicons from '@react-native-vector-icons/ionicons';
import {
  font,
  gap,
  icon,
  margin,
  padding,
  widthResponsive,
} from '../../utils/responsive';
import Toast from './../../Components/Toasts/ToastService';
import {businessCategoryService} from '../../Services/BusinessCategoryService';

const BusinessSetup = () => {
  const navigation = useNavigation();

  const bottomSheetRef = useRef(null);
  const [query, setQuery] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessTypes, setBusinessTypes] = useState([]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [suggestions, setSuggestions] = useState([]);

  // BOTTOM SHEET
  const snapPoints = useMemo(() => ['70%'], []);

  const renderBackdrop = useMemo(
    () => props =>
      (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.8}
        />
      ),
    [],
  );

  const handleOpenBottomSheet = type => {
    bottomSheetRef.current?.expand();
  };
  const handleCloseBottomSheet = type => {
    bottomSheetRef.current?.close();
  };

  const handleContinue = () => {
    if (businessName.length === 0 || !validateBusinessName(businessName)) {
      Toast.show({
        message: 'Enter a valid business name',
        type: 'error',
        position: 'top',
      });
      return;
    }
    if (gstNumber.length > 0 && !validateIndianGST(gstNumber)) {
      Toast.show({
        message: 'Enter a valid GST number',
        type: 'error',
        position: 'top',
      });
      return;
    }
    if (!businessType) {
      Toast.show({
        message: 'Select a business type',
        type: 'error',
        position: 'top',
      });
      return;
    }
    if (email.length > 0 && !validateEmail(email)) {
      Toast.show({
        message: 'Enter a valid email',
        type: 'error',
        position: 'top',
      });
      return;
    }
    if (phone.length > 0 && !validateIndianPhone(phone)) {
      Toast.show({
        message: 'Enter a valid phone number',
        type: 'error',
        position: 'top',
      });
      return;
    }
    navigation.navigate('BusinessSetup2', {
      businessName,
      gstNumber,
      businessType,
      email,
      phone,
    });
  };

  const getBusinessCategory = async () => {
    try {
      const data = await businessCategoryService.getAllBusinessCategory();
      setBusinessTypes(data);
      setSuggestions(data);
    } catch (error) {}
  };

  useEffect(() => {
    getBusinessCategory();
  }, []);

  const handleSearch = text => {
    setQuery(text);
    const filtered = businessTypes.filter(item =>
      item.name.toLowerCase().includes(text.toLowerCase()),
    );
    setSuggestions(filtered);
  };

  const handleCloseOnSelectCategory = useMemo(() => {
    bottomSheetRef.current?.close();
  }, [businessType]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (Platform.OS === 'android') {
          BackHandler.exitApp();
          return true;
        }
      };
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => subscription.remove();
    }, []),
  );

  return (
    <AuthLayout>
      {/* <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}> */}
      <GestureHandlerRootView style={{flex: 1}}>
        <ScrollView style={{flex: 1}} contentContainerStyle={styles.container}>
          <Image
            style={styles.image}
            source={require('./../../../asset/images/business.png')}
            resizeMode="contain"
          />
          <Text style={styles.title}>Set Up Your Business</Text>
          <View style={styles.inputContainer}>
            <SimpleTextInput
              placeholder="Business Name"
              maxLength={50}
              value={businessName}
              setValue={setBusinessName}
              hasError={
                businessName.length > 0 && !validateBusinessName(businessName)
              }
            />
            <SimpleTextInput
              placeholder="GST Number(Optional)"
              maxLength={15}
              upperCase={true}
              value={gstNumber}
              setValue={setGstNumber}
              hasError={gstNumber.length > 0 && !validateIndianGST(gstNumber)}
            />
            <BottomSheetInput
              label={
                businessType
                  ? businessTypes.find(item => item.id === businessType).name
                  : 'Business Type'
              }
              onPress={() => handleOpenBottomSheet('businessType')}
            />
            <SimpleTextInput
              placeholder="Email(Optional)"
              maxLength={100}
              keyboardType="email-address"
              value={email}
              setValue={setEmail}
              hasError={email.length > 0 && !validateEmail(email)}
            />
            <SimpleTextInput
              placeholder="Phone Number(Optional)"
              maxLength={10}
              keyboardType="numeric"
              value={phone}
              setValue={setPhone}
              hasError={phone.length > 0 && !validateIndianPhone(phone)}
            />
          </View>
          <TouchableOpacity style={styles.button} onPress={handleContinue}>
            <Text style={styles.buttonText}>CONTINUE</Text>
          </TouchableOpacity>
        </ScrollView>

        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          enableOverDrag={false}
          enableContentPanningGesture={false}
          backdropComponent={renderBackdrop}
          handleComponent={() => null}
          animationConfigs={{
            duration: 300,
          }}
          backgroundStyle={{borderRadius: 0}}>
          <View style={{flex: 1}}>
            <BottomSheetFlatList
              ListHeaderComponent={useMemo(
                () => (
                  <View style={styles.bottomSheetHeaderContainer}>
                    <View style={styles.bottomSheetHeader}>
                      <Text style={styles.bottomSheetTitle}>
                        Choose Business Type
                      </Text>
                      <TouchableOpacity onPress={handleCloseBottomSheet}>
                        <Ionicons
                          name="close"
                          size={icon(24)}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.searchContainer}>
                      <Ionicons
                        name="search"
                        size={icon(24)}
                        color={colors.border}
                      />
                      <TextInput
                        placeholder="Search here..."
                        style={styles.searchInput}
                        value={query}
                        onChangeText={text => handleSearch(text)}
                      />
                    </View>
                  </View>
                ),
                [query],
              )}
              contentContainerStyle={styles.bottomSheetContainer}
              data={suggestions}
              keyExtractor={(_, index) =>
                index + 'bottomsheet_radiobtn_business_types'
              }
              renderItem={({item}) => (
                <View style={styles.bottomSheetItem}>
                  <RadioInput
                    value={item.id}
                    label={item.name}
                    setValue={setBusinessType}
                    isSelected={businessType === item.id}
                  />
                </View>
              )}
              ItemSeparatorComponent={() => <DottedDivider />}
              stickyHeaderIndices={[0]}
              nestedScrollEnabled
            />
          </View>
        </BottomSheet>
      </GestureHandlerRootView>
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
    width: widthResponsive(130),
    height: widthResponsive(45),
    borderRadius: 5,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: margin(10),
  },
  buttonText: {
    fontSize: font(16),
    fontFamily: fonts.onSemiBold,
    color: '#fff',
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

export default BusinessSetup;
