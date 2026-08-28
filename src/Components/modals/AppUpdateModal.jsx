import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View, Linking, TouchableOpacity, Image, Platform } from 'react-native';
import VersionCheck from 'react-native-version-check';
import { colors } from '../../utils/colors';
import { fonts } from '../../utils/fonts';
import { font, padding, margin } from '../../utils/responsive';
import DeviceInfo from 'react-native-device-info';

const AppUpdateModal = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [storeUrl, setStoreUrl] = useState('');
  
  const checkUpdate = async () => {
    try {
      const currentVersion = DeviceInfo.getVersion();
      let latestVersion = currentVersion;
      
      try {
        latestVersion = await VersionCheck.getLatestVersion();
      } catch (e) {
        console.log("Could not fetch latest version from store", e);
      }
      
      const res = await VersionCheck.needUpdate({
        currentVersion: currentVersion,
        latestVersion: latestVersion,
        packageName: DeviceInfo.getBundleId()
      });

      // Strict version comparison: Only update if store version is strictly GREATER than phone version
      const compareVersions = (v1, v2) => {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
          const p1 = parts1[i] || 0;
          const p2 = parts2[i] || 0;
          if (p1 > p2) return 1;
          if (p1 < p2) return -1;
        }
        return 0;
      };

      const shouldUpdate = res?.isNeeded && compareVersions(latestVersion, currentVersion) > 0;

      if (shouldUpdate) {
        let url = '';
        try {
          url = await VersionCheck.getStoreUrl();
        } catch (e) {
          url = 'market://details?id=com.billtrack';
        }
        setStoreUrl(url);
        setIsUpdateAvailable(true);
      }
    } catch (error) {
      console.log('Error checking app update:', error);
    }
  };

  useEffect(() => {
    checkUpdate();
  }, []);

  const handleUpdate = () => {
    const packageName = DeviceInfo.getBundleId();
    const playStoreMarketUrl = `market://details?id=${packageName}`;
    const playStoreWebUrl = `https://play.google.com/store/apps/details?id=${packageName}`;

    if (Platform.OS === 'android') {
      Linking.canOpenURL(playStoreMarketUrl)
        .then(supported => {
          if (supported) {
            return Linking.openURL(playStoreMarketUrl);
          } else {
            return Linking.openURL(playStoreWebUrl);
          }
        })
        .catch(() => Linking.openURL(playStoreWebUrl));
    } else {
      // iOS handling
      VersionCheck.getAppStoreUrl({ appID: 'YOUR_APP_ID' }) // Replace with your real App ID if iOS is used
        .then(url => Linking.openURL(url))
        .catch(() => {
           if (storeUrl) Linking.openURL(storeUrl);
        });
    }
  };

  return (
    <Modal
      visible={isUpdateAvailable}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.container}>
        <View style={styles.modalContent}>
          <Image 
             source={require('../../../asset/images/logo.png')} 
             style={styles.logo} 
             resizeMode="contain"
          />
          <Text style={styles.title}>Update Available!</Text>
          <Text style={styles.message}>
            A new version of BillTrack is available. Please update to the latest version to enjoy new features and improvements.
          </Text>
          
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
            <Text style={styles.updateButtonText}>UPDATE NOW</Text>
          </TouchableOpacity>
          
          {/* Close button so user can still test the app normally during development */}
          <TouchableOpacity style={styles.laterButton} onPress={() => setIsUpdateAvailable(false)}>
            <Text style={styles.laterButtonText}>Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: padding(20),
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: margin(16),
  },
  title: {
    fontFamily: fonts.onBold,
    fontSize: font(20),
    color: '#000',
    marginBottom: margin(10),
  },
  message: {
    fontFamily: fonts.onRegular,
    fontSize: font(14),
    color: '#666',
    textAlign: 'center',
    marginBottom: margin(20),
    lineHeight: 22,
  },
  updateButton: {
    backgroundColor: colors.primary,
    width: '100%',
    paddingVertical: padding(12),
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: margin(10),
  },
  updateButtonText: {
    color: '#fff',
    fontFamily: fonts.onSemiBold,
    fontSize: font(16),
  },
  laterButton: {
    paddingVertical: padding(8),
  },
  laterButtonText: {
    color: '#666',
    fontFamily: fonts.onMedium,
    fontSize: font(14),
  }
});

export default AppUpdateModal;