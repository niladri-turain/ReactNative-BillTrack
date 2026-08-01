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
import {font, padding} from '../../utils/responsive';
import Ionicons from '@react-native-vector-icons/ionicons';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const StepGuide = ({target, text, onNext, visible, onClose, targetLayout, arrowPosition = 'top'}) => {
  const layout = target || targetLayout;
  if (!layout) return null;

  // If using the older 'visible' prop pattern from BusinessSetup
  const isVisible = visible !== undefined ? visible : true;
  const handleNext = onNext || onClose;

  const {x, y, width, height} = layout;

  return (
    <Modal transparent visible={isVisible} animationType="fade">
      <View style={styles.overlay}>
        {/* Highlight Box */}
        <View
          style={[
            styles.highlight,
            {
              top: y - 5,
              left: x - 5,
              width: width + 10,
              height: height + 10,
            },
          ]}
        />

        {/* Info Bubble */}
        <View
          style={[
            styles.bubble,
            arrowPosition === 'bottom'
              ? {bottom: screenHeight - y + 15}
              : {top: y + height + 20},
            {left: screenWidth * 0.1},
          ]}>
          <Text style={styles.text}>{text}</Text>
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>

          {/* Arrow */}
          <View style={[
            styles.arrow,
            arrowPosition === 'bottom' ? styles.arrowBottom : styles.arrowTop
          ]} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  highlight: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  bubble: {
    position: 'absolute',
    width: screenWidth * 0.8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: padding(15),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    fontSize: font(14),
    fontFamily: fonts.popMedium,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 5,
  },
  buttonText: {
    color: '#fff',
    fontFamily: fonts.popSemiBold,
    fontSize: font(13),
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
  },
  arrowTop: {
    top: -15,
  },
  arrowBottom: {
    bottom: -15,
    transform: [{rotate: '180deg'}],
  }
});

export default StepGuide;
