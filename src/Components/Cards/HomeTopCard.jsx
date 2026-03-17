import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Lucide from '@react-native-vector-icons/lucide';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import {colors} from '../../utils/colors';
import {font, gap, icon, margin, padding} from '../../utils/responsive';
import {fonts} from '../../utils/fonts';

const HomeTopCard = () => {
  return (
    <View style={styles.topContainer}>
      <LinearGradient
        style={styles.topCard}
        colors={[colors.primary, '#FFB084']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <View>
          <Text style={styles.amountText}>5,12,589.00</Text>
          <Text style={styles.revenueText}>Today’s Revenue</Text>
        </View>
        <Image
          style={styles.rupeeIcon}
          source={require('../../../asset/images/rupeeRed.png')}
        />
      </LinearGradient>
      <View style={styles.secondCard}>
        <View style={styles.secondChildCard}>
          <View style={styles.secondChildCardLeft}>
            <Text style={styles.secondCardAmountText}>129</Text>
            <Text style={styles.secondCardRevenueText}>Total Invoices</Text>
          </View>
          <Image
            style={styles.rupeeIcon}
            source={require('./../../../asset/images/billimage.png')}
          />
        </View>
        <View style={styles.secondChildCard}>
          <View style={styles.secondChildCardLeft}>
            <Text style={styles.secondCardAmountText}>83</Text>
            <Text style={styles.secondCardRevenueText}>Total Customer</Text>
          </View>
          <Image
            style={styles.rupeeIcon}
            source={require('./../../../asset/images/userimage.png')}
          />
        </View>
      </View>

      <View style={styles.transactionContainer}>
        <Text style={styles.transactionTitle}>Sales Transaction's</Text>
        <View style={styles.transactionChildContainer}>
          <TouchableOpacity style={styles.transactionChildContainerLeft}>
            <View style={styles.transactionChildContainerIcon}>
              <Lucide name="file-text" size={24} color={colors.sucess} />
            </View>
            <Text style={styles.transactionChildContainerLeftText}>
              Sales Invoice
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.transactionChildContainerLeft}>
            <View style={styles.transactionChildContainerIcon}>
              <Lucide name="credit-card" size={24} color={colors.sucess} />
            </View>
            <Text style={styles.transactionChildContainerLeftText}>
              Receive Payments
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.transactionChildContainerLeft}>
            <View style={styles.transactionChildContainerIcon}>
              <Lucide name="arrow-left-right" size={24} color={colors.sucess} />
            </View>
            <Text style={styles.transactionChildContainerLeftText}>
              Sales Return
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.transactionChildContainerLeft}>
            <View style={styles.transactionChildContainerIcon}>
              <MaterialDesignIcons
                name="email"
                size={24}
                color={colors.sucess}
              />
            </View>
            <Text style={styles.transactionChildContainerLeftText}>
              Credit Note
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.transactionContainer}>
        <Text style={styles.transactionTitle}>Purchase Transactions</Text>
        <View style={styles.transactionChildContainer}>
          <TouchableOpacity style={styles.transactionChildContainerLeft}>
            <View
              style={[
                styles.transactionChildContainerIcon,
                {backgroundColor: '#FF000030'},
              ]}>
              <Lucide name="shopping-cart" size={24} color={'#FF000090'} />
            </View>
            <Text style={styles.transactionChildContainerLeftText}>
              Purchase Invoice
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.transactionChildContainerLeft}>
            <View
              style={[
                styles.transactionChildContainerIcon,
                {backgroundColor: '#FF000030'},
              ]}>
              <Lucide name="credit-card" size={24} color={'#FF000090'} />
            </View>
            <Text style={styles.transactionChildContainerLeftText}>
              Purchase Payments
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.transactionChildContainerLeft}>
            <View
              style={[
                styles.transactionChildContainerIcon,
                {backgroundColor: '#FF000030'},
              ]}>
              <Lucide
                name="align-start-horizontal"
                size={24}
                color={'#FF000090'}
              />
            </View>
            <Text style={styles.transactionChildContainerLeftText}>
              Purchase Return
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.transactionChildContainerLeft}>
            <View
              style={[
                styles.transactionChildContainerIcon,
                {backgroundColor: '#FF000030'},
              ]}>
              <Lucide name="app-window-mac" size={24} color={'#FF000090'} />
            </View>
            <Text style={styles.transactionChildContainerLeftText}>
              Debit &nbsp;&nbsp;Note
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default HomeTopCard;

const styles = StyleSheet.create({
  transactionContainer: {
    marginVertical: margin(5),
    gap: gap(14),
  },
  transactionTitle: {
    fontSize: font(16),
    fontFamily: fonts.inSemiBold,
    color: '#000',
  },
  transactionChildContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: gap(16),
    backgroundColor: '#fff',
    paddingHorizontal: padding(8),
    paddingVertical: padding(16),
    borderRadius: icon(5),
  },
  transactionChildContainerLeft: {
    alignItems: 'center',
    borderRadius: icon(5),
    width: '21%',
    gap: gap(8),
  },
  transactionChildContainerLeftText: {
    fontSize: font(14),
    fontFamily: fonts.inRegular,
    color: '#00000080',
    textAlign: 'center',
    width: '100%',
    flexWrap: 'wrap',
  },
  transactionChildContainerIcon: {
    backgroundColor: colors.sucess + 30,
    padding: padding(8),
    borderRadius: icon(5),
  },
  secondCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: gap(16),
    marginTop: margin(16),
  },
  secondChildCard: {
    flex: 1,
    padding: padding(14),
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: icon(5),
    borderWidth: 2,
    borderColor: colors.primary + 40,
  },
  secondChildCardLeft: {
    flex: 1,
  },
  secondCardAmountText: {
    fontSize: font(24),
    fontFamily: fonts.inBold,
    color: colors.primary,
  },
  secondCardRevenueText: {
    fontSize: font(12),
    fontFamily: fonts.inMedium,
    color: '#000',
  },
  topContainer: {
    marginVertical: margin(16),
    marginHorizontal: margin(16),
  },
  topCard: {
    paddingHorizontal: padding(16),
    paddingVertical: padding(16),
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rupeeIcon: {
    width: icon(40),
    height: icon(40),
  },
  amountText: {
    fontSize: font(24),
    fontFamily: fonts.inBold,
    color: '#fff',
  },
  revenueText: {
    fontSize: font(14),
    fontFamily: fonts.inMedium,
    color: '#fff',
  },
});
