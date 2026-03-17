import {
  Image,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {memo, useCallback, useMemo, useState} from 'react';
import {fonts} from '../../utils/fonts';
import Lucide from '@react-native-vector-icons/lucide';
import {colors} from '../../utils/colors';
import AntDesign from '@react-native-vector-icons/ant-design';
import {API_URL} from '../../utils/config';
import {SlideOutDown} from 'react-native-reanimated';
import {font, gap} from '../../utils/responsive';

const ProductCard = memo(
  ({
    width = 113,
    item,
    handleLongPress = () => {},
    handlePress = () => {},
    editFunction = () => {},
  }) => {
    const PADDING = 8;
    useMemo(() => {
      imageWidth = width - PADDING * 2;
      imageHeight = (imageWidth * 3) / 4;
      buttonSize = width * 0.177;
      iconSize = width * 0.088;
      bottomMarginTop = width * 0.177;
    }, [width]);

    return (
      <View style={[styles.container, {width: width}]}>
        <TouchableOpacity
          style={{width: '100%'}}
          onPress={handlePress}
          onLongPress={handleLongPress}>
          <Image
            style={[styles.image, {height: imageHeight}]}
            source={
              item?.image
                ? {uri: `${API_URL}files/product/${item?.image}`}
                : require('./../../../asset/images/emptyimg.jpg')
            }
            resizeMode="cover"
          />
        </TouchableOpacity>
        <Text
          style={[styles.titleText, {fontSize: font(12)}]}
          numberOfLines={2}>
          {item?.title}
        </Text>
        <View style={[styles.bottomContainer, {marginTop: bottomMarginTop}]}>
          <Text style={[styles.priceText, {fontSize: font(12)}]}>
            ₹{item.price ? item.price : 'NA'}
          </Text>
          <TouchableOpacity
            onPress={editFunction}
            style={[
              styles.buttonIcon,
              {
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize * 0.15,
              },
            ]}>
            <AntDesign name="edit" color={colors.sucess} size={iconSize} />
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'space-between'
  },
  image: {
    width: '100%',
  },
  titleText: {
    fontSize: 12,
    fontFamily: fonts.inMedium,
    color: '#000',
    width: '100%',
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: gap(15),
  },
  priceText: {
    fontSize: font(12),
    fontFamily: fonts.inBold,
    color: '#000',
  },
  buttonIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.sucess + 20,
    borderRadius: 3,
  },
  countContainer: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 26 / 2,
    right: -5,
    top: -5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.sucess,
  },
  countText: {
    fontSize: 12,
    fontFamily: fonts.inBold,
    color: '#fff',
  },
});

export default ProductCard;
