import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedText = Animated.createAnimatedComponent(Text);

const ScanLoader = ({word = 'Scanning'}) => {
  const rotation = useSharedValue(0);
  word += '...';
  const letters = word.split('');

  // Animation for rotating circle
  rotation.value = withRepeat(
    withTiming(360, {
      duration: 2300,
      easing: Easing.linear,
    }),
    -1,
    false,
  );

  const animatedCircleStyle = useAnimatedStyle(() => {
    return {
      transform: [{rotate: `${rotation.value}deg`}],
      shadowColor: '#38bdf8',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: interpolate(
        rotation.value,
        [0, 90, 180, 270, 360],
        [0.3, 0.5, 0.7, 0.5, 0.3],
      ),
      shadowRadius: interpolate(
        rotation.value,
        [0, 90, 180, 270, 360],
        [3, 6, 9, 6, 3],
      ),
    };
  });

  // Letter animation function
  const getLetterAnimation = index => {
    const opacity = useSharedValue(0.4);
    const translateY = useSharedValue(0);

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, {duration: 0}),
        withDelay(
          index * 100,
          withSequence(
            withTiming(1, {duration: 200}),
            withTiming(0.7, {duration: 200}),
            withTiming(0.4, {duration: 200}),
          ),
        ),
      ),
      -1,
      false,
    );

    translateY.value = withRepeat(
      withSequence(
        withTiming(0, {duration: 0}),
        withDelay(
          index * 100,
          withSequence(
            withTiming(-2, {duration: 200}),
            withTiming(0, {duration: 200}),
          ),
        ),
      ),
      -1,
      false,
    );

    return useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{translateY: translateY.value}],
    }));
  };

  return (
    <LinearGradient
      colors={['#1a3379', '#0f172a', '#000']}
      style={styles.loader}
      locations={[0, 0.5, 1]}>
      <View style={styles.loaderWrapper}>
        {letters.map((letter, index) => (
          <AnimatedText
            key={index}
            style={[styles.loaderLetter, getLetterAnimation(index)]}>
            {letter}
          </AnimatedText>
        ))}
        <AnimatedView style={[styles.loaderCircle, animatedCircleStyle]} />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  loaderWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'transparent',
  },
  loaderCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: 90,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    shadowColor: '#38bdf8',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  loaderLetter: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '300',
    color: 'white',
    zIndex: 1,
    borderRadius: 50,
    textShadowColor: 'rgba(248, 252, 255, 0.8)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 2,
  },
});

export default ScanLoader;
