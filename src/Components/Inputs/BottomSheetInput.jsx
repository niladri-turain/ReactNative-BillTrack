import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {memo} from 'react';
import {colors} from '../../utils/colors';
import Ionicons from '@react-native-vector-icons/ionicons';
import {fonts} from '../../utils/fonts';
import {heightResponsive, icon} from '../../utils/responsive';

const BottomSheetInput = ({
  width = '100%',
  height = icon(45),
  isBorder = true,
  backgroundColor = '#fff',
  label = 'Bottom Sheet Input',
  onPress = () => {},
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {width: width, height: height, backgroundColor: backgroundColor},
        isBorder && {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 5,
        },
      ]}>
      <Text style={styles.label}>{label}</Text>
      <Ionicons name="caret-down-outline" size={15} color={colors.primary} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.onMedium,
    color: '#000',
  },
});

export default memo(BottomSheetInput);
