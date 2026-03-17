import React, {memo, useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import ShimmerLine from './ShimmerLine';

const ROWS = [
  {width: '75%', icon: 20},
  {width: '65%', icon: 20},
  {width: '85%', icon: 20},
];

const ItemCardShimmer = () => {
  const rowElements = useMemo(
    () =>
      ROWS.map((row, index) => (
        <View key={index} style={styles.row}>
          <ShimmerLine width={row.width} height={14} />
          <ShimmerLine width={row.icon} height={20} />
        </View>
      )),
    []
  );

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <ShimmerLine width={'55%'} height={18} />
        <ShimmerLine width={30} height={18} />
      </View>

      {/* Items */}
      {rowElements}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    alignItems: 'center',
  },
});

export default memo(ItemCardShimmer);
