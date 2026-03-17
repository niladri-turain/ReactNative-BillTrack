import React, {memo, useMemo} from 'react';
import {View, Dimensions} from 'react-native';
import {BarChart} from 'react-native-gifted-charts';
import {colors} from '../../utils/colors';
import {font, HOME_CHART_HEIGHT} from '../../utils/responsive';

const SalesAreaChart = memo(({barData = []}) => {
  // Memoize chart calculations to prevent unnecessary recalculations
  const chartConfig = useMemo(() => {
    const maxValue = Math.max(...barData.map(item => item.value));
    const chartMaxValue = Math.ceil(maxValue * 1.2);

    // Get screen width (cached)
    const screenWidth = Dimensions.get('window').width;

    // Calculate available width for the chart
    const availableWidth = screenWidth - 100;

    // Calculate dynamic bar width and spacing based on number of bars
    const numberOfBars = barData?.length || 1;
    const calculatedBarWidth = Math.max(
      Math.floor((availableWidth / numberOfBars) * 0.6),
      8,
    );
    const calculatedSpacing = Math.max(
      Math.floor((availableWidth / numberOfBars) * 0.4),
      4,
    );

    return {
      chartMaxValue,
      calculatedBarWidth,
      calculatedSpacing,
    };
  }, [barData]);

  // Memoize style objects to prevent recreation on each render
  const xAxisLabelStyle = useMemo(() => ({fontSize: font(10)}), []);
  const yAxisStyle = useMemo(() => ({fontSize: font(10)}), []);
  const topLabelStyle = useMemo(() => ({fontSize: font(8)}), []);

  return (
    <View>
      <BarChart
        barWidth={chartConfig.calculatedBarWidth}
        spacing={chartConfig.calculatedSpacing}
        height={HOME_CHART_HEIGHT}
        noOfSections={3}
        barBorderRadius={4}
        frontColor={colors.primary}
        data={barData}
        yAxisThickness={0}
        xAxisThickness={0}
        xAxisLabelTextStyle={xAxisLabelStyle}
        yAxisTextStyle={yAxisStyle}
        maxValue={chartConfig.chartMaxValue}
        showValuesAsTopLabel={true}
        topLabelTextStyle={topLabelStyle}
        scrollToEnd={false}
        isAnimated={true}
        hideRules={true}
      />
    </View>
  );
});

export default SalesAreaChart;
