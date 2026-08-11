import {
  Image,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useContext, useEffect, useState} from 'react';
import {Layout} from '../Layout';
import {
  HomeChartComponent,
  HomeChartShimmer,
  HomeTopCard,
  InvoiceCard,
  InvoiceCardShimmer,
  PrimaryHeader,
  SubscriptionModal,
} from '../../Components';
import {colors} from '../../utils/colors';
import {fonts} from '../../utils/fonts';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {
  font,
  gap,
  heightResponsive,
  icon,
  margin,
  padding,
} from '../../utils/responsive';
import {invoiceService} from '../../Services/InvoiceService';
import {useAuthToken, useSubscription} from '../../Contexts/AuthContext';
import {useInvoice} from '../../Contexts/InvoiceContext';
import LinearGradient from 'react-native-linear-gradient';

// Global variable to track if the modal has been shown in the current app session
let isSubscriptionModalShown = false;

const Home = () => {
  const {invoices, resetInvoices} = useInvoice();
  const navigation = useNavigation();
  const token = useAuthToken();
  const subscription = useSubscription();

  // Loading State
  const [isRefreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(invoices.length === 0);
  const [isInitialLoad, setIsInitialLoad] = useState(invoices.length === 0);
  const [lastInvoicesLength, setLastInvoicesLength] = useState(invoices.length);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // useEffect(() => {
  //   // Show modal if user is on a free plan or has no active subscription
  //   // AND it hasn't been shown in this session yet
  //   if (subscription && !subscription.isPremiumPlanAndActive && !isSubscriptionModalShown) {
  //     const timer = setTimeout(() => {
  //       setShowSubscriptionModal(true);
  //       isSubscriptionModalShown = true; // Mark as shown for this session
  //     }, 1500); // Small delay for better UX
  //     return () => clearTimeout(timer);
  //   }
  // }, [subscription]);

  const fetchInvoice = async (silent = false) => {
    try {
      if (!silent && invoices.length === 0 && isInitialLoad) {
        setIsLoading(true);
      }
      const data = await invoiceService.getInvoices(token, 0, 10);
      if (data?.status) {
        resetInvoices(data?.data || []);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInvoice();
    setRefreshTrigger(prev => prev + 1);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (invoices.length === 0) {
        fetchInvoice(!isInitialLoad);
      } else {
        fetchInvoice(true);
      }

      if (invoices.length !== lastInvoicesLength) {
        setRefreshTrigger(prev => prev + 1);
        setLastInvoicesLength(invoices.length);
      }
    }, [token, invoices.length, lastInvoicesLength, isInitialLoad]),
  );

  const {salesData} = useInvoice();

  return (
    <Layout>
      <PrimaryHeader />
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{
          paddingBottom: padding(30),
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary, colors.sucess, colors.error]}
            tintColor={colors.primary}
          />
        }>
        {isInitialLoad && !salesData ? (
          <HomeChartShimmer />
        ) : (
          <HomeChartComponent refreshTrigger={refreshTrigger}  />
        )}
        
        {/* <HomeTopCard /> */}

        <View style={styles.invoiceContainer}>
          <View style={styles.invoiceHeader}>
            <Text style={fonts.headerText}>All Invoice List</Text>
            <TouchableOpacity
              style={styles.headerRight}
              onPress={() => {
                navigation.navigate('Invoice', { screen: 'Invoice' });
              }}>
              <Text style={styles.headerRightText}>See more</Text>
              <Ionicons name="arrow-forward" size={12} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {isLoading && isInitialLoad ? (
            Array(3)
              .fill(null)
              .map((_, index) => (
                <InvoiceCardShimmer key={'invoiceShimmer' + index} />
              ))
          ) : invoices.length > 0 ? (
            invoices.map((item, index) => (
              <InvoiceCard
                invoice={item}
                key={index + '_invoice_card'}
                onRefresh={onRefresh}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Image
                source={require('./../../../asset/images/noInvoice.png')}
                style={styles.emptyImage}
                resizeMode="contain"
              />
             
            </View>
          )}
        </View>
      </ScrollView>

      {/* <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onUpgrade={() => {
          setShowSubscriptionModal(false);
          navigation.navigate('Account', {screen: 'Subscription'});
        }}
      /> */}
    </Layout>
  );
};

const styles = StyleSheet.create({
  invoiceContainer: {
    marginHorizontal: margin(16),
    gap: gap(15),
  },
  invoiceHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: padding(16),
    height: heightResponsive(50),
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: font(12),
    fontFamily: fonts.inMedium,
    color: '#000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: gap(5),
  },
  headerRightText: {
    fontSize: font(12),
    fontFamily: fonts.inMedium,
    color: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // paddingVertical: padding(20),
    // backgroundColor: '#fff',
    // borderRadius: 5,
  },
  emptyImage: {
    width: icon(200),
    height: icon(200),
  },
  emptyText: {
    fontSize: font(16),
    fontFamily: fonts.onSemiBold,
    color: '#333',
    marginTop: margin(-20),
  },
});

export default Home;
