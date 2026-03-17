import React, {useEffect, useMemo} from 'react';
import {StyleSheet} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const ShimmerLine = ({
  width = '100%',
  height = 14,
  radius = 6,
  baseColor = '#e5e5e5',
  highlightColor = '#f2f2f2',
}) => {
  const progress = useSharedValue(0);

  // Start animation once (UI thread only)
  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {duration: 1100}),
      -1,
      false
    );
  }, []);

  // Memoize dynamic container style
  const containerStyle = useMemo(
    () => ({
      width,
      height,
      borderRadius: radius,
      backgroundColor: baseColor,
    }),
    [width, height, radius, baseColor]
  );

  // Memoize dynamic highlight style
  const highlightBaseStyle = useMemo(
    () => ({
      width: '40%',
      height,
      borderRadius: radius,
      backgroundColor: highlightColor,
    }),
    [height, radius, highlightColor]
  );

  // Avoid heavy math inside animation frame
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 100 - 50 }],
    opacity: 0.25 + progress.value * 0.25,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.highlight, highlightBaseStyle, shimmerStyle]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    left: 0,
  },
});

export default React.memo(ShimmerLine);
