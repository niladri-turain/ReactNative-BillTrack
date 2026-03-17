import {Image, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {font, icon} from '../../utils/responsive';
import { fonts } from '../../utils/fonts';

const EmptyProductComponent = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require('./../../../asset/images/emptybox.webp')}
        resizeMode="contain"
        style={styles.image}
      />
      <Text style={styles.text}>No Product</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: icon(200),
    height: icon(200),
  },
  text:{
    fontSize:font(18),
    fontFamily:fonts.onMedium
  }
});

export default EmptyProductComponent;
