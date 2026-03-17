import {StyleSheet, Text, TextInput, View} from 'react-native';
import React, {memo} from 'react';
import Octicons from '@react-native-vector-icons/octicons';
import {colors} from '../../utils/colors';
import {fonts} from '../../utils/fonts';
import {font, heightResponsive, icon} from '../../utils/responsive';

const SimpleTextInput = ({
  placeholder = 'Enter Text',
  color = colors.sucess,
  width = '100%',
  height = icon(45),
  isBorder = true,
  borderColor = colors.border,
  borderRadius = 5,
  backgroundColor = '#fff',
  keyboardType = 'default',
  minLength = 0,
  maxLength = 100,
  value = '',
  setValue,
  hasError = false,
  upperCase = false,
  placeholderTextColor = colors.border,
  fontSize = font(14),
  disabled = false,
  multiline=false
}) => {
  return (
    <View
      style={[
        styles.container,
        {width: width, height: height, backgroundColor: backgroundColor},
        isBorder && {
          borderWidth: 1,
          borderColor: hasError ? colors.error : borderColor,
          borderRadius: borderRadius,
        },
      ]}>
      <TextInput
        placeholder={placeholder}
        keyboardType={keyboardType}
        value={value}
        onChangeText={text => {
          if (upperCase) {
            text = text.toUpperCase();
          }
          if (text.length <= maxLength && text.length >= minLength)
            setValue(text);
        }}
        maxLength={maxLength}
        style={[styles.inputBox, {fontSize: fontSize}]}
        placeholderTextColor={placeholderTextColor}
        editable={!disabled}
        multiline={multiline}
      />
      {value.length > 0 && (
        <Octicons
          name={hasError ? 'x-circle-fill' : 'check-circle-fill'}
          size={16}
          color={
            value.length > 0 ? (hasError ? colors.error : color) : colors.border
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inputBox: {
    flex: 1,
    // fontSize: 14,
    fontFamily: fonts.onMedium,
  },
});

export default SimpleTextInput;
