import {StyleSheet, Text, View, Image, TouchableOpacity} from 'react-native';
import React from 'react';
import {Layout} from '../Layout';
import {font, icon, padding} from '../../utils/responsive';
import {fonts} from '../../utils/fonts';

const OfflineScreen = ({onRetry}) => {
  return (
    <Layout>
      <View style={styles.container}>
        <Image
          source={require('./../../../asset/images/offline.png')}
          style={styles.image}
          resizeMode="contain"
        />

        <Text style={styles.title}>You’re Offline</Text>
        <Text style={styles.subtitle}>
          No internet connection found. Please check your network settings.
        </Text>

        {onRetry && (
          <TouchableOpacity style={styles.button} onPress={onRetry}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  image: {
    width: icon(220),
    height: icon(220),
    marginBottom: icon(24),
  },
  title: {
    fontSize: font(22),
    fontFamily: fonts.inSemiBold,
    color: '#111',
    marginBottom: icon(8),
  },
  subtitle: {
    fontSize: font(14),
    fontFamily: fonts.inMedium,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: icon(24),
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: padding(12),
    paddingHorizontal: padding(28),
    borderRadius: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: font(14),
    fontFamily: fonts.inMedium,
  },
});

export default OfflineScreen;
