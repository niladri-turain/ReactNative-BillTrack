import React, {useState, memo} from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WebView} from 'react-native-webview';
import {useRoute} from '@react-navigation/native';
import {Loader} from '../../Components';
import {colors} from '../../utils/colors';

const BrowserScreen = () => {
  const route = useRoute();
  const uri = route.params?.uri || 'https://billtrack.co.in';
  const [loading, setLoading] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{uri}}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />
      {loading && (
        <View style={styles.loader}>
          <Loader />
        </View>
      )}
    </SafeAreaView>
  );
};

export default memo(BrowserScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  webview: {
    flex: 1,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: colors.primaryBackground,
  },
});
