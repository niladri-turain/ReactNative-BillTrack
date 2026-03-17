import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import React from 'react';
import {
  font,
  gap,
  margin,
  padding,
  widthResponsive,
} from '../../utils/responsive';
import {fonts} from '../../utils/fonts';
import {colors} from '../../utils/colors';
import {API_URL} from '../../utils/config';

const ProductCardRow = ({item, onpressCard = () => {}}) => {
  return (
    <Pressable style={styles.container} onPress={onpressCard}>
      <View style={styles.leftCOntainer}>
        <Image
          source={
            item.image
              ? {uri: `${API_URL}files/product/${item.image}`}
              : require('./../../../asset/images/emptyimg.jpg')
          }
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.leftRightContainer}>
          <Text style={styles.nameText}>{item?.title}</Text>
          <Text style={styles.subNameText}>Per {item?.unit}</Text>
        </View>
      </View>
      <View>
        <Text style={styles.priceText}>₹ {item?.price}</Text>
        <Text style={[styles.subNameText, {color: colors.error}]}>
          Per {item?.unit}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: padding(10),
    paddingHorizontal: padding(9),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: margin(5),
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  leftCOntainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap(16),
  },
  image: {
    width: widthResponsive(55),
    aspectRatio: 11 / 8,
  },
  leftRightContainer: {
    gap: gap(6),
    flex: 1
  },
  nameText: {
    fontSize: font(14),
    fontFamily: fonts.inSemiBold,
    color: '#000',
    flexShrink: 1,
    flexWrap: 'wrap',
    letterSpacing: 0.5,
  },
  subNameText: {
    fontSize: font(12),
    fontFamily: fonts.inMedium,
    color: '#00000080',
  },
  priceText: {
    fontSize: font(16),
    fontFamily: fonts.inSemiBold,
    color: '#000',
    textAlign: 'right',
  },
});

export default ProductCardRow;
