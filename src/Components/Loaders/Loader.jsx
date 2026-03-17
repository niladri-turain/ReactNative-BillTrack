import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

const BLADE_COUNT = 12;

const Blade = React.memo(({ index, progress }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const bladeProgress = (progress.value + (BLADE_COUNT - index) / BLADE_COUNT) % 1;
    const opacity = bladeProgress < 0.5 ? bladeProgress * 2 : (1 - bladeProgress) * 2;

    return { opacity };
  }, [progress]);

  return (
    <Animated.View
      style={[
        styles.blade,
        {
          transform: [{ rotate: `${index * 30}deg` }, { translateY: -8 }],
        },
        animatedStyle,
      ]}
    />
  );
});

const Loader = () => {
  const progress = useSharedValue(0);

  // Initialize animation once using useEffect
  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );

    return () => cancelAnimation(progress);
  }, [progress]);

  // Memoize renderBlade to avoid recreating function on every render
  const renderBlade = useCallback(
    (_, index) => <Blade key={index} index={index} progress={progress} />,
    [progress]
  );

  return <View style={styles.spinner}>{Array.from({ length: BLADE_COUNT }).map(renderBlade)}</View>;
};

const styles = StyleSheet.create({
  spinner: {
    width: 28,
    height: 28,
    position: 'relative',
  },
  blade: {
    position: 'absolute',
    width: 2,
    height: 8,
    backgroundColor: '#69717d',
    borderRadius: 1,
    top: '50%',
    left: '50%',
    marginLeft: -1,
    marginTop: -4,
    transformOrigin: 'center -6',
  },
});

export default Loader;
