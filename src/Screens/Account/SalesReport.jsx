import {
  ActivityIndicator,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Layout} from '../Layout';
import {
  CommonModal,
  DottedDivider,
  HomeChartShimmer,
  SalesAreaChart,
  SecondaryHeader,
} from '../../Components';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import {colors} from '../../utils/colors';
import {font, gap, icon, margin, padding} from '../../utils/responsive';
import Ionicons from '@react-native-vector-icons/ionicons';
import {fonts} from '../../utils/fonts';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import AntDesign from '@react-native-vector-icons/ant-design';
import {useAuthToken} from '../../Contexts/AuthContext';
import {salesReportService} from '../../Services/SalesReportService';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import RNFS from 'react-native-fs';
import ToastService from '../../Components/Toasts/ToastService';

const SalesReport = memo(() => {
  const token = useAuthToken();

  const [selectedPriod, setSelectedPriod] = useState('Monthly');
  const [selectedDownload, setSelectedDownload] = useState('Today');
  const [selectedDownloadType, setSelectedDownloadType] = useState('PDF');
  const [chartData, setChartData] = useState(null);
  const [currentSalesPercentage, setCurrentSalesPercentage] = useState(0);
  const [previousSalesPercentage, setPreviousSalesPercentage] = useState(0);

  // Loading State
  const [isLoading, setIsLaoding] = useState(false);
  const [isDownloadLoading, setIsDownloadLoading] = useState(false);
  const [isRefreshing, setRefreshing] = useState(false);

  // bottomsheet contents
  const bottomSheetRef = useRef(null);
  const snapPont = useMemo(() => ['30%'], []);

  const handleOpenBottomSheet = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const handleCloseBottomSheet = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

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

  const fetchGraphData = async () => {
    try {
      setIsLaoding(true);
      let period =
        selectedPriod === 'Monthly'
          ? 'month'
          : selectedPriod.trim().toLowerCase().replace(/\s+/g, '');

      if (period === '1year') {
        period = '1year';
      }

      const data = await salesReportService.getSalesReportByPeriod(
        token,
        period,
      );
      if (data?.status) {
        setChartData(data?.data);
        const currentSales = Number(data?.data?.totalSales) || 0;
        const previousSales = Number(data?.data?.previousTotalSales) || 0;
        let currentSalesP;
        let prevSalesPercentage;

        // ----- Current Sales Percentage (compared to previous month) -----
        if (previousSales === 0) {
          // If last month was 0
          currentSalesP = currentSales > 0 ? 100 : 0;
        } else {
          currentSalesP =
            ((currentSales - previousSales) / previousSales) * 100;
        }

        if (currentSales === 0) {
          prevSalesPercentage = previousSales > 0 ? 100 : 0;
        } else {
          prevSalesPercentage =
            ((previousSales - currentSales) / currentSales) * 100;
        }

        setCurrentSalesPercentage(currentSalesP);
        setPreviousSalesPercentage(prevSalesPercentage);
      }
    } catch (error) {
    } finally {
      setIsLaoding(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, [selectedPriod]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGraphData();
    setRefreshing(false);
  };

  const handleDownload = () => {
    let period = selectedDownload.toLowerCase();
    if (period === 'year') {
      period = '1year';
    }
    handleDownloadReport(period);
  };

  const handleDownloadReport = async period => {
    try {
      setIsDownloadLoading(true);
      const type = selectedDownloadType.toLowerCase();

      const config = await salesReportService.exportSalesReport({
        token,
        period,
        type,
      });

      if (config?.status && config?.url) {
        let extension = '';
        if (type === 'excel') {
          extension = '.xlsx';
        } else if (type === 'pdf') {
          extension = '.pdf';
        } else {
          extension = '.csv';
        }

        const fileName = `Sales_Report_${period}_${Date.now()}${extension}`;
        const filePath = `${
          Platform.OS === 'android'
            ? RNFS.DownloadDirectoryPath
            : RNFS.DocumentDirectoryPath
        }/${fileName}`;

        const options = {
          fromUrl: config.url,
          toFile: filePath,
          headers: {
            Authorization: `Bearer ${config.token}`,
          },
        };

        const result = await RNFS.downloadFile(options).promise;

        if (result.statusCode === 200) {
          if (Platform.OS === 'android') {
            await RNFS.scanFile(filePath);
          }

          ToastService.show({
            message: 'Report downloaded successfully',
            type: 'success',
            duration: 2000,
          });

          // Open the file
          try {
            const fileUri =
              Platform.OS === 'android' ? 'file://' + filePath : filePath;
            await Linking.openURL(fileUri);
          } catch (err) {
            console.warn('Could not open file automatically:', err);
            ToastService.show({
              message: 'Report saved to downloads',
              type: 'success',
            });
          }
        } else {
          ToastService.show({
            message: 'Failed to download report',
            type: 'error',
          });
        }
      } else {
        ToastService.show({
          message: config?.message || 'Failed to initialize download',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      ToastService.show({
        message: 'Something went wrong',
        type: 'error',
      });
    } finally {
      setIsDownloadLoading(false);
      handleCloseBottomSheet();
    }
  };


  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Layout>
        <SecondaryHeader title="Sales report" isSearch={false} />
        <ScrollView
          style={{flex: 1, backgroundColor: '#fff'}}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[colors.primary, colors.sucess, colors.error]}
              tintColor={colors.primary}
            />
          }>
          <View style={styles.topContainer}>
            <View style={styles.topButtonContainer}>
              <View style={styles.downloadContainer}>
                <Text style={styles.downloadText}>
                  Download detailed report
                </Text>
                <TouchableOpacity onPress={handleOpenBottomSheet}>
                  <Text style={styles.clickText}>
                    Click to choose period & file type
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={handleOpenBottomSheet}>
                <MaterialDesignIcons
                  name="file-download-outline"
                  color={'#fff'}
                  size={icon(20)}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.salesContainer}>
              <View style={styles.sales}>
                <View style={styles.salesHeader}>
                  <Text style={styles.salesText}>Sales</Text>
                  <Text
                    style={[
                      styles.salesText,
                      {
                        color:
                          currentSalesPercentage >= 0
                            ? colors.sucess
                            : colors.error,
                      },
                    ]}>
                    {currentSalesPercentage >= 0 ? '+' : ''}
                    {currentSalesPercentage.toFixed(2)}%
                  </Text>
                  <Ionicons
                    name={currentSalesPercentage >= 0 ? 'arrow-up' : 'arrow-up'}
                    color={
                      currentSalesPercentage >= 0 ? colors.sucess : colors.error
                    }
                  />
                </View>
                <Text style={styles.salesAmount}>
                  ₹ {chartData?.totalSales}
                </Text>
                <Text style={styles.salesBottomText} numberOfLines={2}>
                  Compared to (₹{' '}
                  {chartData?.totalSales - chartData?.previousTotalSales} last
                  period)
                </Text>
              </View>
              <View style={styles.sales}>
                <View style={styles.salesHeader}>
                  <Text style={styles.salesText}>Previous</Text>
                  <Text
                    style={[
                      styles.salesText,
                      {
                        color:
                          previousSalesPercentage >= 0
                            ? colors.sucess
                            : colors.error,
                      },
                    ]}>
                    {previousSalesPercentage >= 0 ? '+' : ''}
                    {previousSalesPercentage.toFixed(2)}%
                  </Text>
                  <Ionicons
                    name={
                      previousSalesPercentage >= 0 ? 'arrow-up' : 'arrow-down'
                    }
                    color={
                      previousSalesPercentage >= 0
                        ? colors.sucess
                        : colors.error
                    }
                  />
                </View>
                <Text style={styles.salesAmount}>
                  ₹ {chartData?.previousTotalSales}
                </Text>
                <Text style={styles.salesBottomText} numberOfLines={2}>
                  Compared to (₹ {chartData?.totalSales} current period)
                </Text>
              </View>
            </View>
          </View>
          {isLoading ? (
            <HomeChartShimmer />
          ) : (
            <View style={styles.container}>
              <View style={{backgroundColor: colors.primaryBackground, borderRadius: 5}}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.selectableContainer}>
                  {['Monthly', '3 Months', '6 Months', '1 Year'].map(period => (
                    <TouchableOpacity
                      key={period}
                      style={[
                        styles.selectable,
                        selectedPriod === period && {
                          backgroundColor: '#fff',
                          borderRadius: 5,
                          borderWidth: 0.5,
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => setSelectedPriod(period)}>
                      <Text
                        style={[
                          styles.selectedText,
                          {fontSize: 10},
                          selectedPriod === period && {color: colors.primary},
                        ]}>
                        {period}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={{paddingBottom: padding(5)}}>
                <SalesAreaChart barData={chartData?.data} />
              </View>
            </View>
          )}
        </ScrollView>
      </Layout>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPont}
        index={-1}
        backdropComponent={renderBackdrop}
        backgroundStyle={{borderRadius: 0}}
        enableOverDrag={false}
        handleComponent={() => null}>
        <BottomSheetView style={{flex: 1}}>
          <View style={styles.bottomSheetHeaderContainer}>
            <View>
              <Text style={styles.downloadText}>Select option to download</Text>
              <Text style={styles.clickText}>
                Choose desire conditions for reports
              </Text>
            </View>
            <TouchableOpacity onPress={handleCloseBottomSheet}>
              <AntDesign name="close" size={icon(18)} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <DottedDivider marginVertical={0} borderWidth={0.8} />
          <View style={styles.bottomSheetSelectedContainer}>
            {['Today', 'Week', 'Month', 'Year'].map(item => (
              <TouchableOpacity
                key={item + 'first'}
                style={[
                  styles.bottomSheetSelectedButton,
                  selectedDownload === item && {
                    backgroundColor: colors.primary + 40,
                  },
                ]}
                onPress={() => setSelectedDownload(item)}>
                <Text
                  style={[
                    styles.bottomSheetSelectedText,
                    selectedDownload === item && {color: colors.primary},
                  ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.bottomSheetSelectedContainer}>
            {['Excel', 'PDF', 'CSV'].map(item => (
              <TouchableOpacity
                key={item + 'first'}
                style={[
                  styles.bottomSheetSelectedButton,
                  selectedDownloadType === item && {
                    backgroundColor: colors.primary + 40,
                  },
                ]}
                onPress={() => setSelectedDownloadType(item)}>
                <Text
                  style={[
                    styles.bottomSheetSelectedText,
                    selectedDownloadType === item && {color: colors.primary},
                  ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownload}
            disabled={isDownloadLoading}>
            {isDownloadLoading ? (
              <ActivityIndicator size="small" color={'#fff'} />
            ) : (
              <Text style={styles.downloadButtonText}>Download</Text>
            )}
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
});

const styles = StyleSheet.create({
  topContainer: {
    paddingHorizontal: padding(16),
    paddingVertical: padding(16),
    borderTopWidth: 0.8,
    borderColor: colors.border,
  },
  topButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: padding(10),
  },
  downloadBtn: {
    width: icon(40),
    height: icon(40),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: icon(8),
  },
  downloadContainer: {},
  downloadText: {
    fontSize: font(16),
    fontFamily: fonts.inSemiBold,
  },
  clickText: {
    fontSize: font(12),
    fontFamily: fonts.inRegular,
    color: '#00000080',
  },
  salesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  sales: {
    width: '48%',
    backgroundColor: '#F7F7F7',
    paddingHorizontal: padding(16),
    paddingVertical: padding(15),
    borderRadius: icon(10),
    gap: gap(5),
    borderWidth: 1,
    borderColor: colors.border,
  },
  salesHeader: {
    flexDirection: 'row',
    gap: gap(5),
    alignItems: 'center',
  },
  salesText: {
    fontSize: font(12),
    fontFamily: fonts.inSemiBold,
  },
  salesAmount: {
    fontSize: font(18),
    fontFamily: fonts.inSemiBold,
  },
  salesBottomText: {
    fontSize: font(10),
    fontFamily: fonts.inRegular,
  },
  container: {
    // padding: padding(16),
    backgroundColor: '#fff',
    borderRadius: 5,
    // marginVertical: margin(20),
    marginHorizontal: margin(16),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: padding(9),
    gap: gap(10),
  },
  selectable: {
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
  // salesContainer: {
  //   marginTop: margin(15),
  //   gap: gap(10),
  // },
  // sales: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   gap: gap(10),
  // },
  salesPercentage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salesText: {
    // fontSize: 14,
    fontFamily: fonts.inMedium,
    color: '#00000090',
  },
  salesAmount: {
    // fontSize: 24,
    fontFamily: fonts.inBold,
    color: '#000',
  },
  salesPercentageText: {
    // fontSize: 12,
    fontFamily: fonts.inMedium,
    color: colors.sucess,
  },
  bottomSheetHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: padding(16),
    paddingVertical: padding(16),
  },
  bottomSheetSelectedContainer: {
    paddingHorizontal: padding(16),
    paddingVertical: padding(10),
    flexDirection: 'row',
    gap: gap(16),
  },
  bottomSheetSelectedButton: {
    paddingHorizontal: padding(20),
    paddingVertical: padding(10),
    backgroundColor: colors.border + 50,
    borderRadius: 1000,
  },
  bottomSheetSelectedText: {
    fontSize: font(12),
    fontFamily: fonts.inMedium,
  },
  downloadButton: {
    paddingVertical: padding(16),
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: margin(16),
    marginVertical: margin(20),
  },
  downloadButtonText: {
    fontSize: font(16),
    fontFamily: fonts.inSemiBold,
    color: '#fff',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: padding(16),
    borderRadius: 10,
    justifyContent: 'center',
  },
  modalDateContainer: {
    marginVertical: 10,
    gap: gap(5),
  },
  modalDateText: {
    fontSize: font(12),
    fontFamily: fonts.inMedium,
    color: '#000000',
  },
  modalDateButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 5,
    paddingVertical: padding(10),
    paddingHorizontal: padding(20),
  },
  modalApplyButton: {
    backgroundColor: colors.primary,
    paddingVertical: padding(10),
    paddingHorizontal: padding(20),
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyButtonText: {
    fontSize: font(14),
    fontFamily: fonts.inMedium,
    color: '#fff',
  },
});

export default SalesReport;
