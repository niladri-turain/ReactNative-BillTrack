import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {colors} from '../../utils/colors';

const DottedDivider = ({marginVertical = 10, borderWidth = 0.6}) => {
  return (
    <View
      style={[
        styles.container,
        {marginVertical: marginVertical, borderWidth: borderWidth},
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    // height: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
});

export default DottedDivider;
