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
import React, {useContext, useEffect, useState} from 'react';
import {Layout} from '../Layout';
import {
  HomeChartComponent,
  HomeChartShimmer,
  HomeTopCard,
  InvoiceCard,
  InvoiceCardShimmer,
  PrimaryHeader,
} from '../../Components';
import {colors} from '../../utils/colors';
import {fonts} from '../../utils/fonts';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useNavigation} from '@react-navigation/native';
import {
  font,
  gap,
  heightResponsive,
  icon,
  margin,
  padding,
} from '../../utils/responsive';
import {invoiceService} from '../../Services/InvoiceService';
import {useAuthToken} from '../../Contexts/AuthContext';
import {useInvoice} from '../../Contexts/InvoiceContext';
import LinearGradient from 'react-native-linear-gradient';

const Home = () => {
  const {invoices, resetInvoices} = useInvoice();
  const navigation = useNavigation();
  const token = useAuthToken();

  // Loading State
  const [isRefreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // state variables
  // const [invoices, setInvoices] = useState(contextInvoices);

  const fetchInvoice = async () => {
    try {
      setIsLoading(true);
      const data = await invoiceService.getInvoices(token, 0, 10);
      if (data?.status) {
        // setInvoices(data?.data || []);
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

  useEffect(() => {
    fetchInvoice();
  }, [token]);

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
        {isInitialLoad ? (
          <HomeChartShimmer />
        ) : (
          <HomeChartComponent refreshTrigger={refreshTrigger} />
        )}
        
        {/* <HomeTopCard /> */}

        <View style={styles.invoiceContainer}>
          <View style={styles.invoiceHeader}>
            <Text style={fonts.headerText}>All Invoice List</Text>
            <TouchableOpacity
              style={styles.headerRight}
              onPress={() => {
                navigation.navigate('Invoice');
              }}>
              <Text style={styles.headerRightText}>See more</Text>
              <Ionicons name="arrow-forward" size={12} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {isLoading
            ? Array(3)
                .fill(null)
                .map((_, index) => (
                  <InvoiceCardShimmer key={'invoiceShimmer' + index} />
                ))
            : invoices.map((item, index) => (
                <InvoiceCard invoice={item} key={index + '_invoice_card'} />
              ))}
        </View>
      </ScrollView>
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
});

export default Home;
