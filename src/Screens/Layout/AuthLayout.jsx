import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../utils/colors';

const AuthLayout = ({ children }) => {
  const inset = useSafeAreaInsets()
  return (
        <SafeAreaView style={styles.safeArea}>

    <KeyboardAvoidingView
      style={[styles.flex,{paddingBottom: inset.bottom}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.primary} />
      <ImageBackground
        resizeMode="cover"
        source={require('./../../../asset/images/authBack.png')}
        style={styles.flex}
      >
          {children}
          <View style={styles.circle} />
          <View style={[styles.leftCircle]} />
      </ImageBackground>
    </KeyboardAvoidingView>
        </SafeAreaView>

  );
};

export default AuthLayout;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  circle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 150 / 2,
    backgroundColor: colors.primary + 20,
    zIndex: -1,
    right: -75,
    top: 100,
  },
  leftCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 150 / 2,
    backgroundColor: colors.primary + 20,
    zIndex: -1,
    left: -75,
    bottom: 100,
  },
});
