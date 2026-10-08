import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useMemo, useState} from 'react';
import {Layout} from '../Layout';
import {SecondaryHeader} from '../../Components';
import {font, gap, padding} from '../../utils/responsive';
import {fonts} from '../../utils/fonts';
import {useAuthToken} from '../../Contexts/AuthContext';
import {subscriptionService} from '../../Services/SubscriptionService';
import {useFocusEffect} from '@react-navigation/native';
import {colors} from '../../utils/colors';
import {mapSubscriptionTransactions} from '../../Models/SubscriptionTransactionModel';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import ReactNativeBlobUtil from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
import ToastService from '../../Components/Toasts/ToastService';
import {API_URL} from '../../utils/config';

const Transaction = () => {
  const token = useAuthToken();

  const [transactions, setTransactions] = useState([]);
  const [query, setQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const currentDate = new Date();

  const fetchTransactions = async () => {
    try {
      const data = await subscriptionService.allSubscriptions(token);
      if (data.status) {
        setTransactions(mapSubscriptionTransactions(data.data));
      }
    } catch (error) {}
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchTransactions();
    setIsRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, []),
  );

  function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString.replace(' ', 'T'));

    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

 const filteredTransactions = useMemo(() => {
  if (!query?.trim()) return transactions;

  const q = query.toLowerCase();

  return transactions.filter(item => {
    return (
      item.planName?.toLowerCase().includes(q) ||
      item.subscriptionStartDate?.toLowerCase().includes(q) ||
      item.subscriptionEndDate?.toLowerCase().includes(q) ||
      item.billNumber?.toLowerCase().includes(q) ||
      item.createdAt?.toLowerCase().includes(q) ||
      item.updatedAt?.toLowerCase().includes(q) ||
      String(item.totalAmount)?.includes(q) ||
      String(item.id)?.includes(q) ||
      String(item.businessId)?.includes(q) ||
      item.orderId?.toLowerCase().includes(q) ||
      item.paymentId?.toLowerCase().includes(q)
    );
  });
}, [query, transactions]);

  const showMessage = message => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
      ToastService.show({message, type: 'error'});
    }
  };

  const handleDownloadInvoice = async item => {
    if (!item.downloadUrl || downloadingId !== null) return;
    setDownloadingId(item.id);
    try {
      const apiOrigin = API_URL.replace(/\/api\/v1\/?$/, '');
      const url = /^https?:\/\//i.test(item.downloadUrl)
        ? item.downloadUrl
        : `${apiOrigin}${item.downloadUrl.startsWith('/') ? '' : '/'}${item.downloadUrl}`;
      const fileName = `${item.billNumber || `invoice_${item.id}`}.pdf`;
      const {fs, config} = ReactNativeBlobUtil;
      const path = `${Platform.OS === 'android' ? fs.dirs.DownloadDir : fs.dirs.DocumentDir}/${fileName}`;
      await config({
        fileCache: true,
        path,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path,
          description: 'Downloading invoice...',
          mime: 'application/pdf',
          mediaScannable: true,
        },
      }).fetch('GET', url, {Authorization: `Bearer ${token}`});
      await FileViewer.open(path, {showOpenWithDialog: true});
    } catch (error) {
      console.error('[Transaction] Invoice download failed:', error);
      showMessage('Unable to download invoice');
    } finally {
      setDownloadingId(null);
    }
  };


  return (
    <Layout>
      <SecondaryHeader
        title="Transactions"
        query={query}
        onchangeText={text => {
          setQuery(text);
        }}
      />
      <FlatList
        style={{flex: 1}}
        contentContainerStyle={styles.container}
        data={filteredTransactions}
        keyExtractor={(_, index) => index.toString()}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        renderItem={({item}) => (
          <View style={styles.cardContainer}>
            <View style={styles.textContainer}>
              <Text style={styles.planNameText}>{item.planName}</Text>
              {currentDate > new Date(item.subscriptionEndDate?.replace(' ', 'T')) ? (
                <Text style={[styles.smallText, {color: colors.error}]}>
                  Plan Expired
                </Text>
              ) : (
                <Text style={[styles.smallText]}>
                  Until {formatDate(item.subscriptionEndDate)}
                </Text>
              )}
              <TouchableOpacity
                style={styles.downloadInvoiceButton}
                onPress={() => handleDownloadInvoice(item)}
                disabled={downloadingId !== null}
                accessibilityRole="button"
                accessibilityLabel={`Download invoice ${item.billNumber}`}>
                <MaterialIcons
                  name="file-download"
                  size={font(20)}
                  color={colors.primary}
                />
                <Text style={styles.downloadInvoiceText}>
                  {downloadingId === item.id ? 'Downloading...' : 'Download invoice'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.bigText,
                  {textAlign: 'right', color: colors.sucess},
                ]}>
                ₹ {item.totalAmount}
              </Text>
              <Text style={[styles.smallText, {textAlign: 'right'}]}>
                {formatDate(item.subscriptionStartDate)}
              </Text>
            </View>
          </View>
        )}
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: padding(16),
    paddingTop: padding(10),
    paddingBottom: padding(30),
  },
  cardContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: padding(16),
    paddingVertical: padding(10),
    borderRadius: padding(10),
    marginBottom: padding(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bigText: {
    fontSize: font(16),
    fontFamily: fonts.inSemiBold,
  },
  planNameText: {
    fontSize: font(13),
    fontFamily: fonts.inSemiBold,
  },
  textContainer: {
    gap: gap(4),
  },
  smallText: {
    fontSize: font(12),
    fontFamily: fonts.inSemiBold,
  },
  downloadInvoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: gap(4),
    marginTop: 2,
  },
  downloadInvoiceText: {
    color: colors.primary,
    fontSize: font(11),
    fontFamily: fonts.inSemiBold,
  },
});

export default Transaction;
