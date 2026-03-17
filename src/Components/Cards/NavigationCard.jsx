import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {font, gap, padding, icon} from '../../utils/responsive';
import {fonts} from '../../utils/fonts';
import MaterialIcons from '@react-native-vector-icons/material-icons';

const NavigationCard = ({title, onpress = () => {}}) => {
  return (
    <TouchableOpacity style={styles.settingCard} onPress={onpress}>
      <Text style={styles.itemText}>{title}</Text>
      <View style={styles.rightContainer}>
        <MaterialIcons
          name="arrow-forward-ios"
          size={icon(16)}
          color={'#000'}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  settingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: padding(16),
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap(16),
  },
  itemText: {
    fontSize: font(14),
    fontFamily: fonts.popRegular,
  },
  rightContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NavigationCard;
