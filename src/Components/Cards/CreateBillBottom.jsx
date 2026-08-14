import {
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
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const CreateBillBottom = memo(
  ({
    totalAmount = 0,
    totalQuanity = 0,
    saveButtonFunciton,
    paymentMode = 'cash',
    cashButtonFunction,
    createButtonRef,
    onLayout,
  }) => {
    const {width} = useWindowDimensions();
    const inset = useSafeAreaInsets();

    const sizes = useMemo(() => {
      const bottomButtonPaddingH = width * 0.053;
      return {
        bottomButtonPaddingH,
      };
    }, [width]);

    // Matches Home screen tab bar height logic: 85 + inset.bottom
    const containerHeight = 85 + inset.bottom;

    return (
      <View
        style={[
          styles.bottomContainer,
          {
            height: containerHeight,
            paddingBottom: inset.bottom,
          },
        ]}>
        <View style={styles.contentContainer}>
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
              ref={createButtonRef}
              onLayout={onLayout}
              style={[
                styles.bottomButton,
                {
                  paddingHorizontal: sizes.bottomButtonPaddingH,
                },
              ]}
              onPress={saveButtonFunciton}>
              <Text style={[styles.bottomButtonText, {color: '#fff'}]}>
                CREATE
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  bottomContainer: {
    backgroundColor: '#fff',
    width: '100%',
    paddingHorizontal: padding(16),
    borderTopWidth: 1,
    borderTopColor: '#00000010',
    // Matches tab bar shadow/elevation
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 20,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: padding(10),
  },
  bottomContainerSub: {
    gap: 2,
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
    height: icon(35),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 5,
  },
  bottomButtonText: {
    fontSize: font(12),
    fontFamily: fonts.inBold,
  },
});

export default CreateBillBottom;
