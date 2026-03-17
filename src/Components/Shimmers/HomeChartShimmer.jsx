import React, {memo} from 'react';
import {View, StyleSheet} from 'react-native';
import ShimmerLine from './ShimmerLine';
import {gap, HOME_CHART_HEIGHT, margin, padding} from '../../utils/responsive';
import {colors} from '../../utils/colors';

const HomeChartShimmer = () => {
  return (
    <View style={styles.container}>
      {/* Period selection shimmer */}
      <View style={styles.selectableContainer}>
        <ShimmerLine width="30%" height={36} radius={5} />
        <ShimmerLine width="30%" height={36} radius={5} />
        <ShimmerLine width="30%" height={36} radius={5} />
      </View>

      {/* Sales title shimmer */}
      <View style={styles.salesContainer}>
        <ShimmerLine width="40%" height={20} radius={4} />

        {/* Sales amount and percentage shimmer */}
        <View style={styles.sales}>
          <ShimmerLine width="35%" height={30} radius={6} />
          <ShimmerLine width="25%" height={20} radius={4} />
        </View>
      </View>

      {/* Chart shimmer */}
      <View style={styles.chartContainer}>
        <View style={styles.barsContainer}>
          {[40, 70, 55, 80, 60, 45, 85].map((height, index) => (
            <View key={index} style={styles.barWrapper}>
              <ShimmerLine
                width={22}
                // height={`${height}%`}
                height={(HOME_CHART_HEIGHT * height) / 100}
                radius={4}
                baseColor="#e5e5e5"
                highlightColor="#f2f2f2"
              />
              <ShimmerLine
                width={24}
                height={16}
                radius={3}
                baseColor="#f0f0f0"
                highlightColor="#f5f5f5"
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: padding(12),
    backgroundColor: '#fff',
    borderRadius: 5,
    marginVertical: margin(20),
    marginHorizontal: margin(16),
  },
  selectableContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryBackground,
    alignItems: 'center',
    padding: padding(8),
    borderRadius: 5,
  },
  salesContainer: {
    marginTop: margin(15),
    gap: gap(16),
  },
  sales: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap(10),
  },
  chartContainer: {
    marginTop: margin(20),
    paddingBottom: padding(5),
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: HOME_CHART_HEIGHT + 16,
    paddingHorizontal: padding(10),
  },
  barWrapper: {
    alignItems: 'center',
    gap: gap(8),
    flex: 1,
    justifyContent: 'flex-end',
  },
});

export default memo(HomeChartShimmer);
