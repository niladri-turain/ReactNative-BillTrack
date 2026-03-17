import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {memo, useCallback} from 'react';
import {colors} from '../../utils/colors';
import {fonts} from '../../utils/fonts';
import {icon} from '../../utils/responsive';

const RadioInput = ({
  value,
  label,
  setValue,
  isSelected = false,
  height = icon(30),
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, {height: height}]}
      onPress={() => {
        setValue(value);
      }}>
      <Text style={[styles.label, isSelected && {color: colors.primary}]}>
        {label}
      </Text>
      <View
        style={[
          styles.selectContainer,
          isSelected && {borderColor: colors.primary},
        ]}>
        {isSelected && <View style={[styles.innerSelect]} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  },
  selectContainer: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 15 / 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerSelect: {
    width: 12.5,
    height: 12.5,
    borderRadius: 15 / 1,
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.onMedium,
    color: '#000',
  },
});

export default memo(RadioInput);
