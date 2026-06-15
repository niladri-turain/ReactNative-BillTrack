import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View, Linking, TouchableOpacity, Image } from 'react-native';
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
        latestVersion: latestVersion
      });
       console.log("currentVersion", currentVersion);
       console.log("latestVersion", latestVersion);
      
      const shouldUpdate = res?.isNeeded;

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
    if (storeUrl) {
      Linking.openURL(storeUrl).catch(() => {
        Linking.openURL('market://details?id=com.billtrack');
      });
    } else {
      Linking.openURL('market://details?id=com.billtrack');
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