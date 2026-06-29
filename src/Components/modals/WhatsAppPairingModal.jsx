import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Clipboard,
  ToastAndroid,
} from 'react-native';
import CommonModal from './CommonModal';
import {colors} from '../../utils/colors';
import {fonts} from '../../utils/fonts';
import {font, gap, padding, margin} from '../../utils/responsive';
import Ionicons from '@react-native-vector-icons/ionicons';

const WhatsAppPairingModal = ({visible, onClose, pairingCode, isLoading}) => {
  const copyToClipboard = () => {
    if (pairingCode) {
      Clipboard.setString(pairingCode);
      ToastAndroid.show('Pairing code copied!', ToastAndroid.SHORT);
    }
  };

  return (
    <CommonModal visible={visible} handleClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>WhatsApp Pairing</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : pairingCode ? (
            <>
              <Text style={styles.instructions}>
                Enter this code on your phone to link WhatsApp:
              </Text>
              <TouchableOpacity
                style={styles.codeContainer}
                onLongPress={copyToClipboard}
                onPress={copyToClipboard}
                activeOpacity={0.7}>
                {pairingCode.split('').map((char, index) => (
                  <View key={index} style={styles.charBox}>
                    <Text style={styles.charText}>{char}</Text>
                  </View>
                ))}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={copyToClipboard}
                style={styles.copyButton}>
                <Ionicons name="copy-outline" size={16} color={colors.primary} />
                <Text style={styles.copyText}>Copy Code</Text>
              </TouchableOpacity>
              <Text style={styles.subInstructions}>
                Open WhatsApp {'>'} Linked Devices {'>'} Link with phone number
              </Text>
            </>
          ) : (
            <Text style={styles.errorText}>
              Failed to generate pairing code. Please try again.
            </Text>
          )}
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </CommonModal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: padding(20),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: margin(15),
  },
  title: {
    fontSize: font(18),
    fontFamily: fonts.popSemiBold,
    color: colors.primary,
  },
  content: {
    alignItems: 'center',
    marginVertical: margin(20),
    gap: gap(15),
  },
  instructions: {
    fontSize: font(14),
    fontFamily: fonts.popMedium,
    textAlign: 'center',
    color: '#333',
  },
  codeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: gap(8),
    marginVertical: margin(10),
  },
  charBox: {
    width: 35,
    height: 45,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  charText: {
    fontSize: font(20),
    fontFamily: fonts.popBold,
    color: colors.primary,
  },
  subInstructions: {
    fontSize: font(12),
    fontFamily: fonts.popRegular,
    textAlign: 'center',
    color: '#666',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap(5),
    paddingVertical: padding(5),
  },
  copyText: {
    fontSize: font(13),
    fontFamily: fonts.popMedium,
    color: colors.primary,
  },
  closeButton: {
    backgroundColor: colors.primary,
    paddingVertical: padding(12),
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: font(16),
    fontFamily: fonts.popSemiBold,
  },
  errorText: {
    color: colors.error,
    fontSize: font(14),
    fontFamily: fonts.popMedium,
  },
});

export default WhatsAppPairingModal;
