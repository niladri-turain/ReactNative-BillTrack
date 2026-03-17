import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {font, gap, padding, icon} from '../../utils/responsive';
import {fonts} from '../../utils/fonts';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {colors} from '../../utils/colors';

const SettingItemsCard = ({
  mainIcon,
  title,
  onpress = () => {},
  tag = false,
  tagText = '',
  textFontSize = 14,
  disabled = false,
}) => {
  return (
    <TouchableOpacity style={styles.settingCard} onPress={onpress} disabled={disabled}>
      <View style={styles.leftContainer}>
        {mainIcon}
        <Text style={[styles.itemText, {fontSize: font(textFontSize)}]}>
          {title}
        </Text>
        {tag && <Text style={styles.newText}>{tagText}</Text>}
      </View>
      <TouchableOpacity style={styles.rightContainer}>
        <MaterialIcons
          name="arrow-forward-ios"
          size={icon(16)}
          color={'#000'}
        />
      </TouchableOpacity>
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
    fontFamily: fonts.popRegular,
  },
  newText: {
    backgroundColor: colors.primary,
    paddingHorizontal: padding(10),
    paddingVertical: padding(1),
    borderRadius: icon(15),
    color: '#fff',
    fontFamily: fonts.inMedium,
    fontSize: font(10),
  },
  rightContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SettingItemsCard;
