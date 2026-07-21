import {Image, StyleSheet, Text, View} from 'react-native';
import React, {memo} from 'react';
import {font, icon, margin} from '../../utils/responsive';
import {fonts} from '../../utils/fonts';

const EmptyListCard = ({title = 'No Data Found'}) => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../../asset/images/noInvoice.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

export default memo(EmptyListCard);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyImage: {
    width: icon(200),
    height: icon(200),
  },
  title: {
    fontSize: font(16),
    fontFamily: fonts.onSemiBold,
    color: '#333',
    marginTop: margin(-20),
  },
});
