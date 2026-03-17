import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import React, {memo, useMemo} from 'react';
import {fonts} from '../../utils/fonts';
import {colors} from '../../utils/colors';
import Ionicons from '@react-native-vector-icons/ionicons';
import {font, icon, padding} from '../../utils/responsive';

// const {width} = Dimensions.get('screen');

const CreateBillBottom = memo(
  ({
    totalAmount = 0,
    totalQuanity = 0,
    saveButtonFunciton,
    paymentMode = 'cash',
    cashButtonFunction,
  }) => {
    const {width} = useWindowDimensions();

    const sizes = useMemo(() => {
      const bottomButtonPaddingH = width * 0.053;
      const bottomButtonText = width * 0.032;
      const bottomButtonContainerGap = width * 0.026;
      const iconSize = width * 0.024;

      return {
        bottomButtonPaddingH,
        bottomButtonText,
        bottomButtonContainerGap,
        iconSize,
      };
    }, [width]);

    return (
      <View style={[styles.bottomContainer]}>
        <View style={styles.bottomContainerSub}>
          <Text style={[styles.bottomCOntainerTitle]}>Total Amount</Text>
          <Text style={[styles.bottomCOntainerValue]}>
            ₹ {totalAmount.toFixed(2)}
          </Text>
        </View>
        <View style={styles.bottomContainerSub}>
          <Text style={[styles.bottomCOntainerTitle]}>Quantity</Text>
          <Text style={[styles.bottomCOntainerValue, {textAlign: 'center'}]}>
            {totalQuanity}
          </Text>
        </View>
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={[
              styles.bottomButton,
              {
                backgroundColor: colors.sucess + 15,
                paddingHorizontal: sizes.bottomButtonPaddingH,
              },
            ]}
            onPress={cashButtonFunction}>
            <Text style={[styles.bottomButtonText, {color: colors.sucess}]}>
              {paymentMode.toUpperCase()}
            </Text>
            <Ionicons name="caret-down" size={8} color={colors.sucess} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.bottomButton,
              {
                paddingHorizontal: sizes.bottomButtonPaddingH,
              },
            ]}
            onPress={saveButtonFunciton}>
            <Text style={[styles.bottomButtonText, {color: '#fff'}]}>SAVE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  bottomContainer: {
    backgroundColor: '#fff',
    width: '100%',
    // height: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: padding(16),
    paddingTop: padding(10),
    paddingBottom: padding(20),
  },
  bottomContainerSub: {
    gap: 5,
  },
  bottomCOntainerTitle: {
    fontSize: font(10),
    fontFamily: fonts.inRegular,
    color: '#00000080',
  },
  bottomCOntainerValue: {
    fontSize: font(16),
    fontFamily: fonts.inBold,
    color: '#000',
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  bottomButton: {
    height: icon(31),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    // paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 5,
  },
  bottomButtonText: {
    fontSize: 12,
    fontFamily: fonts.inBold,
  },
});

export default CreateBillBottom;
