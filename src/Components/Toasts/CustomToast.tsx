// components/CustomToast.tsx
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import Ionicons from '@react-native-vector-icons/ionicons';

const { height } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface CustomToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  position?: ToastPosition;
  duration?: number;
  onHide?: () => void;
}

const icons: Record<ToastType, { name: string; color: string }> = {
  success: { name: 'checkmark-circle', color: '#16a34a' },
  error: { name: 'close-circle', color: '#dc2626' },
  warning: { name: 'warning', color: '#f59e0b' },
  info: { name: 'information-circle', color: '#2563eb' },
};

const CustomToast: React.FC<CustomToastProps> = React.memo(
  ({ visible, message, type = 'info', position = 'top', duration = 2000, onHide }) => {
    const opacity = useSharedValue(0);
    const offset = useSharedValue(0);

    useEffect(() => {
      if (visible) {
        opacity.value = withTiming(1, { duration: 200 });
        offset.value = withTiming(1, { duration: 200 });

        const timer = setTimeout(() => {
          opacity.value = withTiming(0, { duration: 200 }, () => runOnJS(onHide || (() => {}))());
          offset.value = withTiming(0, { duration: 200 });
        }, duration);
        return () => clearTimeout(timer);
      }
    }, [visible, duration]);

    const animatedStyle = useAnimatedStyle(() => {
      const transforms = [];
      if (position === 'top') transforms.push({ translateY: (1 - offset.value) * -60 });
      else if (position === 'bottom') transforms.push({ translateY: (1 - offset.value) * 60 });
      else if (position === 'left') transforms.push({ translateX: (1 - offset.value) * -100 });
      else if (position === 'right') transforms.push({ translateX: (1 - offset.value) * 100 });

      return { opacity: opacity.value, transform: transforms };
    });

    const posStyle = useMemo(() => {
      switch (position) {
        case 'top':
          return { top: 80, alignSelf: 'center' };
        case 'bottom':
          return { bottom: 80, alignSelf: 'center' };
        case 'left':
          return { left: 20, top: height / 2 - 40 };
        case 'right':
          return { right: 20, top: height / 2 - 40 };
        default:
          return { top: height / 2 - 40, alignSelf: 'center' };
      }
    }, [position]);

    if (!visible) return null;

    const icon = icons[type];
    return (
      <Animated.View style={[styles.toast, posStyle, animatedStyle]}>
        <Ionicons name={icon.name} size={22} color={icon.color} style={styles.icon} />
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  text: { color: '#111', fontSize: 15, fontWeight: '500' },
  icon: { marginRight: 8 },
});

export default CustomToast;
