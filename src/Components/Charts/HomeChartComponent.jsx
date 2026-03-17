import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {memo, useCallback, useEffect, useMemo, useState} from 'react';
import {colors} from '../../utils/colors';
import {fonts} from '../../utils/fonts';
import Ionicons from '@react-native-vector-icons/ionicons';
import SalesAreaChart from './SalesAreaChart';
import {
  font,
  gap,
  heightResponsive,
  margin,
  padding,
} from '../../utils/responsive';
import {salesReportService} from '../../Services/SalesReportService';
import {useAuthToken} from '../../Contexts/AuthContext';
import HomeChartShimmer from '../Shimmers/HomeChartShimmer';

const {width} = Dimensions.get('screen');

const HomeChartComponent = memo(
  ({salesDurations = ['Today', 'Week', 'Month'], refreshTrigger}) => {
    const token = useAuthToken();
    const [selectedPriod, setSelectedPriod] = React.useState('Today');
    const [salesData, setSalesData] = useState(null);
    const [salesPercentage, setSalesPercentage] = useState(0);

    // Loading State
    const [isLoading, setIsLaoding] = useState(true);

    const fetchSales = useCallback(async () => {
      try {
        setIsLaoding(true);
        const data = await salesReportService.getSalesReportByPeriod(
          token,
          selectedPriod.toLowerCase(),
        );
        if (data?.status) {
          setSalesData(data?.data);

          const totalSales = data?.data?.totalSales ?? 0;
          const previousTotalSales = data?.data?.previousTotalSales ?? 0;

          let percentage = 0;

          if (previousTotalSales === 0) {
            // If no previous sales:
            percentage = totalSales > 0 ? 100 : 0;
          } else {
            // Normal calculation
            percentage =
              ((totalSales - previousTotalSales) / previousTotalSales) * 100;
          }
          setSalesPercentage(percentage);
        }
      } catch (error) {
      } finally {
          setIsLaoding(false);
      }
    }, [selectedPriod]);

    const handleChangePriod = period => {
      try {
        setSelectedPriod(period);
      } catch (error) {}
    };

    useEffect(() => {
      fetchSales();
    }, [selectedPriod, refreshTrigger]);

    if (isLoading) {
      return <HomeChartShimmer />;
    }

    return (
      <View style={styles.container}>
        <View style={styles.selectableContainer}>
          {salesDurations.map(period => (
            <TouchableOpacity
              key={period}
              onPress={() => handleChangePriod(period)}
              style={[
                styles.selectable,
                selectedPriod === period && {
                  backgroundColor: '#fff',
                  borderRadius: 5,
                  borderWidth: 0.5,
                  borderColor: colors.primary,
                },
              ]}>
              <Text
                style={[
                  styles.selectedText,
                  selectedPriod === period && {color: colors.primary},
                ]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.salesContainer}>
          <Text style={[styles.salesText]}>{selectedPriod}'s Sales</Text>
          <View style={styles.sales}>
            <Text style={[styles.salesAmount]}>₹ {salesData?.totalSales}</Text>
            <View style={styles.salesPercentage}>
              <Ionicons
                name={salesPercentage > 0 ? 'arrow-up' : 'arrow-down'}
                size={12}
                color={salesPercentage > 0 ? colors.sucess : colors.error}
              />
              <Text
                style={[
                  styles.salesPercentageText,
                  salesPercentage <=0 && {color: colors.error},
                ]}>
                {salesPercentage.toFixed(2)}%{' '}
                {salesPercentage > 0 ? 'increased' : 'decreased'}
              </Text>
            </View>
          </View>
        </View>
        <View style={{paddingBottom: padding(5)}}>
          <SalesAreaChart barData={salesData?.data} key={'saled-chart-home'} />
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    padding: padding(12),
    backgroundColor: '#fff',
    borderRadius: 5,
    marginVertical: margin(20),
    marginHorizontal: margin(16),
  },
  selectableContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // height: 48,
    backgroundColor: colors.primaryBackground,
    alignItems: 'center',
    padding: padding(8),
    borderRadius: 5,
  },
  selectable: {
    width: '30%',
    // height: heightResponsive(30),
    paddingVertical: padding(9),
    paddingHorizontal: padding(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    fontSize: font(12),
    fontFamily: fonts.inMedium,
    color: '#000000',
  },
  salesContainer: {
    marginTop: margin(15),
    gap: gap(10),
  },
  sales: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap(10),
  },
  salesPercentage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salesText: {
    fontSize: font(14),
    fontFamily: fonts.inMedium,
    color: '#00000090',
  },
  salesAmount: {
    fontSize: font(24),
    fontFamily: fonts.inBold,
    color: '#000',
  },
  salesPercentageText: {
    fontSize: font(12),
    fontFamily: fonts.inMedium,
    color: colors.sucess,
  },
});

export default HomeChartComponent;
