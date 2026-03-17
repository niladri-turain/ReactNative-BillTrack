import React, {memo} from 'react';
import {StyleSheet, View} from 'react-native';
import ShimmerLine from './ShimmerLine';
import DottedDivider from '../Dividers/DottedDivider';
import {gap, padding, font, icon} from '../../utils/responsive';

const BottomItem = memo(() => (
  <View style={styles.subBottomContainer}>
    <ShimmerLine width={icon(18)} height={icon(18)} radius={icon(9)} />
    <ShimmerLine width={50} height={font(12)} radius={4} />
  </View>
));

const InvoiceCardShimmer = () => {
  return (
    <View style={styles.mainContainer}>
      <View style={styles.container}>
        <View style={styles.left}>
          <ShimmerLine width={60} height={font(14)} radius={4} />
          <ShimmerLine width={100} height={font(12)} radius={4} />
        </View>

        <ShimmerLine width={70} height={font(10)} radius={4} />

        <View style={styles.right}>
          <ShimmerLine width={45} height={font(14)} radius={5} />
          <ShimmerLine width={70} height={font(14)} radius={4} />
        </View>
      </View>

      <DottedDivider />

      <View style={styles.bottomContainer}>
        <BottomItem />
        <BottomItem />
        <BottomItem />
        <BottomItem />
      </View>
    </View>
  );
};

export default memo(InvoiceCardShimmer);

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingVertical: padding(10),
  },
  container: {
    paddingHorizontal: padding(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    gap: 6,
  },
  right: {
    gap: 6,
    alignItems: 'flex-end',
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: padding(16),
  },
  subBottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap(5),
  },
});
