import {FlatList, StyleSheet, Text, View} from 'react-native';
import React, {useCallback, useMemo, useState} from 'react';
import {Layout} from '../Layout';
import {SecondaryHeader} from '../../Components';
import {font, gap, padding} from '../../utils/responsive';
import {fonts} from '../../utils/fonts';
import {useAuthToken} from '../../Contexts/AuthContext';
import {subscriptionService} from '../../Services/SubscriptionService';
import {useFocusEffect} from '@react-navigation/native';
import {colors} from '../../utils/colors';

const Transaction = () => {
  const token = useAuthToken();

  const [transactions, setTransactions] = useState([]);
  const [query, setQuery] = useState('');
  const currentDate = new Date();

  const fetchTransactions = async () => {
    try {
      const data = await subscriptionService.allSubscriptions(token);
      if (data.status) {
        setTransactions(data.data);
      }
    } catch (error) {}
  };

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, []),
  );

  function formatDate(dateString) {
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
      item.plan?.toLowerCase().includes(q) ||
      item.startDate?.toLowerCase().includes(q) ||
      item.endDate?.toLowerCase().includes(q) ||
      item.createdAt?.toLowerCase().includes(q) ||
      item.updatedAt?.toLowerCase().includes(q) ||
      String(item.amount)?.includes(q) ||
      String(item.id)?.includes(q) ||
      String(item.businessId)?.includes(q) ||
      item.orderId?.toLowerCase().includes(q) ||
      item.paymentId?.toLowerCase().includes(q)
    );
  });
}, [query, transactions]);


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
        renderItem={({item}) => (
          <View style={styles.cardContainer}>
            <View style={styles.textContainer}>
              <Text style={styles.bigText}>{item.plan.toUpperCase()}</Text>
              {currentDate > new Date(item.endDate) ? (
                <Text style={[styles.smallText, {color: colors.error}]}>
                  Plan Expired
                </Text>
              ) : (
                <Text style={[styles.smallText]}>
                  Until {formatDate(item.endDate)}
                </Text>
              )}
            </View>
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.bigText,
                  {textAlign: 'right', color: colors.sucess},
                ]}>
                ₹ {item.amount}
              </Text>
              <Text style={[styles.smallText, {textAlign: 'right'}]}>
                {formatDate(item.startDate)}
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
  textContainer: {
    gap: gap(4),
  },
  smallText: {
    fontSize: font(12),
    fontFamily: fonts.inSemiBold,
  },
});

export default Transaction;
