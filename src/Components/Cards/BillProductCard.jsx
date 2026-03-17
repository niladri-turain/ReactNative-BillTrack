import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {memo, useCallback, useEffect, useMemo, useState} from 'react';
import {fonts} from '../../utils/fonts';
import Lucide from '@react-native-vector-icons/lucide';
import {colors} from '../../utils/colors';
import {API_URL} from '../../utils/config';
import {font, gap} from '../../utils/responsive';

const BillProductCard = memo(
  ({width = 113, item, setQuantity, setTotalPrice}) => {
    const PADDING = 8;
    const [count, setCount] = useState(item?.count || 0);

    useMemo(() => {
      imageWidth = width - PADDING * 2;
      imageHeight = (imageWidth * 3) / 4;
      buttonSize = width * 0.177;
      iconSize = width * 0.088;
      bottomMarginTop = width * 0.177;
    }, [width]);

    const increaseDecrease = useCallback(
      way => {
        const isIncrease = way === 'increase';

        if (isIncrease) {
          item.count = (item.count || 0) + 1;
          setCount(prev => {
            // if (prev === 0) {
            //   setQuantity(q => q + 1);
            // }
            return prev + 1;
          });
          setQuantity(q => q + 1);
          setTotalPrice(prev => prev + new Number(item.price));
        } else {
          if (item.count > 0) {
            item.count -= 1;
            setCount(prev => {
              const newCount = prev - 1;
              // if (newCount === 0) {
              //   setQuantity(q => q - 1);
              // }
              setTotalPrice(p => p - new Number(item.price));
              return newCount;
            });
            setQuantity(q => q - 1);
          }
        }
      },
      [item, setQuantity, setTotalPrice],
    );

    useEffect(() => {
      setCount(item?.count || 0);
    }, [item?.count]);

    return (
      <View style={[styles.container, {width: width}]}>
        <TouchableOpacity
          style={{width: '100%'}}
          onPress={() => increaseDecrease('increase')}
          onLongPress={() => {
            ToastAndroid.show('Long Press', ToastAndroid.SHORT);
          }}>
          <Image
            style={[styles.image, {height: imageHeight}]}
            source={
              item?.logo
                ? {uri: `${API_URL}files/product/${item.logo}`}
                : require('./../../../asset/images/emptyimg.jpg')
            }
            resizeMode="cover"
          />
        </TouchableOpacity>
        <Text
          style={[styles.titleText, {fontSize: font(12)}]}
          numberOfLines={2}>
          {item?.name}
        </Text>
        <View style={[styles.bottomContainer, {marginTop: bottomMarginTop}]}>
          <Text style={[styles.priceText, {fontSize: font(12)}]}>
            ₹{item.price}
          </Text>
          <TouchableOpacity
            onPress={() => increaseDecrease('descrease')}
            style={[
              styles.buttonIcon,
              {
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize * 0.15,
              },
            ]}>
            <Lucide name="minus" color={'#fff'} size={iconSize} />
          </TouchableOpacity>
        </View>
        {count > 0 && (
          <View style={styles.countContainer}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
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
    backgroundColor: colors.error,
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

export default BillProductCard;
