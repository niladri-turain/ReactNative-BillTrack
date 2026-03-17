import {StyleSheet, Text, TextInput, View} from 'react-native';
import React from 'react';
import {colors} from '../../utils/colors';
import Ionicons from '@react-native-vector-icons/ionicons';
import {fonts} from '../../utils/fonts';

const SearchInput = ({
  width = '100%',
  height = 45,
  placeholder = 'Search',
  value,
  setValue = value => {},
  keyboardType = 'default',
}) => {
  return (
    <View style={[styles.container, {width: width, height: height}]}>
      <Ionicons name="search" size={24} color={colors.border} />
      <TextInput
        placeholder={placeholder}
        style={styles.input}
        value={value}
        onChangeText={text => setValue(text)}
        keyboardType={keyboardType}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    borderRadius: 5,
    paddingHorizontal: 10,
    gap: 5,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.onMedium,
  },
});

export default SearchInput;
