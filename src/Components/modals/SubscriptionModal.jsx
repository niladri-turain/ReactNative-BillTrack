import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import {colors} from '../../utils/colors';
import {fonts} from '../../utils/fonts';
import {font, gap, icon, margin, padding} from '../../utils/responsive';
import Ionicons from '@react-native-vector-icons/ionicons';
import AntDesign from '@react-native-vector-icons/ant-design';

const {width} = Dimensions.get('window');

const SubscriptionModal = ({visible, onClose, onUpgrade}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <Ionicons name="close" size={28} color="#999" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <AntDesign name="crown" size={60} color={colors.primary} />
          </View>

          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.description}>
            You are currently using the Free Plan. Upgrade to Premium to unlock all professional features and grow your business.
          </Text>

          <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade}>
            <Text style={styles.upgradeBtnText}>Upgrade Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: padding(24),
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  iconContainer: {
    width: icon(100),
    height: icon(100),
    borderRadius: icon(50),
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: margin(20),
  },
  title: {
    fontSize: font(22),
    fontFamily: fonts.inBold,
    color: '#333',
    marginBottom: margin(10),
    textAlign: 'center',
  },
  description: {
    fontSize: font(14),
    fontFamily: fonts.inMedium,
    color: '#666',
    textAlign: 'center',
    marginBottom: margin(25),
    lineHeight: font(20),
  },
  upgradeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: padding(12),
    paddingHorizontal: padding(30),
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  upgradeBtnText: {
    color: '#fff',
    fontSize: font(16),
    fontFamily: fonts.inBold,
  },
});

export default SubscriptionModal;
