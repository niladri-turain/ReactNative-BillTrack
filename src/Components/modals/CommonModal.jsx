import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import React, {memo} from 'react';
import {padding} from '../../utils/responsive';

const CommonModal = ({
  children,
  visible = false,
  transparent = true,
  handleClose,
  animationType = 'fade',
}) => {
  return (
    <Modal
      visible={visible}
      transparent={transparent}
      animationType={animationType}>
      <Pressable style={styles.container} onPress={handleClose}>
        <Pressable style={styles.subContaienr} onPress={() => {}}>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00000050',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subContaienr: {
    width: '100%',
    borderRadius: 8,
    padding: padding(16),
  },
});

export default memo(CommonModal);
