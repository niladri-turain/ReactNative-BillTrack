import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {AuthLayout} from '../Layout';
import {fonts} from './../../utils/fonts';
import {colors} from './../../utils/colors';

import Ionicons from '@react-native-vector-icons/ionicons';
import {useRef, useState} from 'react';
import {StackActions, useNavigation} from '@react-navigation/native';

const {width} = Dimensions.get('screen');

const Onboarding = () => {
  const PAGE_DETAILS = [
    {
      id: '1',
      image: require('./../../../asset/images/onb1.png'),
      title: 'Welcome To BillTrack',
      isDesc: true,
      desc: 'Simplify your billing and payments. Track expenses, automate payments, and stay on top of your finances.',
    },
    {
      id: '2',
      image: require('./../../../asset/images/onb2.png'),
      title: 'Smart Billing Tools',
      isDesc: false,
      contents: [
        'Generate GST-compliant invoices.',
        'Track invoices with real-time updates.',
        'Use powerful analytics to grow your business.',
        'Access your data from multiple devices anytime, anywhere.',
      ],
    },
    {
      id: '3',
      image: require('./../../../asset/images/onb3.png'),
      title: 'Optimize Your Workflow',
      isDesc: false,
      contents: [
        'Automate recurring invoices and reminders.',
        'Save time with ready-made templates.',
        'Use expense tracking and budgeting tools for better financial insights.',
      ],
    },
  ];

  // REF
  const flatListRef = useRef(null);
  const navigation = useNavigation();

  // STATE VARIAbLES
  const [currentPage, setCurrentPage] = useState(0);

  return (
    <AuthLayout>
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          style={{flex: 1, width: '100%'}}
          data={PAGE_DETAILS}
          keyExtractor={(_, index) => '' + index}
          horizontal={true}
          pagingEnabled={true}
          showsHorizontalScrollIndicator={false}
          snapToInterval={width}
          decelerationRate={'fast'}
          scrollEventThrottle={16}
          renderItem={({item, index}) => {
            return (
              <View style={styles.pageContainer}>
                <Image
                  source={item.image}
                  style={styles.image}
                  resizeMode="contain"
                />
                <View style={styles.pageTextContainer}>
                  <Text style={styles.titleText}>{item.title}</Text>
                  {item.isDesc ? (
                    <Text style={styles.descriptionText}>{item.desc}</Text>
                  ) : (
                    <View style={styles.contentContainerParent}>
                      {item.contents.map((content, index) => {
                        return (
                          <View
                            style={styles.contentContainer}
                            key={index + '-content-texts'}>
                            <Ionicons
                              name="arrow-forward-circle-outline"
                              size={16}
                              color={colors.primary}
                            />
                            <Text style={styles.contentText}>{content}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
            );
          }}
          onMomentumScrollEnd={e => {
            const contentOffset = e.nativeEvent.contentOffset.x;
            const newIndex = Math.round(contentOffset / width);
            if (newIndex !== currentPage) {
              setCurrentPage(newIndex);
            }
          }}
        />
        <View style={styles.indicatorContainer}>
          {PAGE_DETAILS.map((item, index) => {
            return (
              <View
                key={index + '-indicator'}
                style={[
                  styles.indicator,
                  currentPage === index && styles.activeIndicator,
                ]}
              />
            );
          })}
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            if (currentPage < PAGE_DETAILS.length - 1) {
              flatListRef.current?.scrollToIndex({
                index: currentPage + 1,
                animated: true,
              });
            } else {
              navigation.dispatch(StackActions.replace('Login'));
            }
          }}>
          <Text style={styles.buttonText}>
            {currentPage === 0
              ? 'NEXT'
              : currentPage === 1
              ? 'CONTINUE'
              : 'GET STARTED'}
          </Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 0.85,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageContainer: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  pageTextContainer: {
    width: width * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  image: {
    width: width * 0.7,
    height: width * 0.7,
  },
  titleText: {
    fontSize: 22,
    fontFamily: fonts.onBold,
    color: '#000',
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: fonts.onMedium,
    color: '#000',
    textAlign: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  contentContainerParent: {
    gap: 10,
    marginTop: 15,
    width: '100%',
  },
  contentText: {
    fontSize: 14,
    fontFamily: fonts.onMedium,
    flex: 1,
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 10,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 8 / 2,
    backgroundColor: '#12121280',
  },
  activeIndicator: {
    width: 20,
    backgroundColor: colors.primary,
  },
  button: {
    height: 45,
    width: width * 0.4,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 20,
    marginVertical: 30,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: fonts.onBold,
    color: '#fff',
  },
});

export default Onboarding;
