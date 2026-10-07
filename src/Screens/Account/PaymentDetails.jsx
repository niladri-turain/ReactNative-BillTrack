import React, {useState, useEffect, useCallback, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ToastAndroid,
} from 'react-native';
import {Layout} from '../Layout';
import {SecondaryHeader, SimpleTextInput, CommonModal} from '../../Components';
import {colors} from '../../utils/colors';
import {fonts} from '../../utils/fonts';
import {font, icon, margin, padding} from '../../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@react-native-vector-icons/ionicons';
import MaterialIcons from '@react-native-vector-icons/material-icons';

const PaymentDetails = memo(() => {
  const [upiIds, setUpiIds] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newUpi, setNewUpi] = useState('');

  useEffect(() => {
    loadUpiIds();
  }, []);

  const loadUpiIds = async () => {
    try {
      const storedUpi = await AsyncStorage.getItem('upi_ids');
      if (storedUpi) {
        setUpiIds(JSON.parse(storedUpi));
      }
    } catch (error) {
      console.error('Error loading UPI IDs:', error);
    }
  };

  const saveUpiIds = async (updatedList) => {
    try {
      await AsyncStorage.setItem('upi_ids', JSON.stringify(updatedList));
      setUpiIds(updatedList);
    } catch (error) {
      console.error('Error saving UPI IDs:', error);
    }
  };

  const handleAddUpi = () => {
    if (!newUpi.trim()) {
      ToastAndroid.show('Please enter a valid UPI ID', ToastAndroid.SHORT);
      return;
    }

    // Simple UPI validation regex
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(newUpi.trim())) {
        ToastAndroid.show('Invalid UPI ID format', ToastAndroid.SHORT);
        return;
    }

    const isFirst = upiIds.length === 0;
    const updatedList = [...upiIds, {id: Date.now(), upi: newUpi.trim(), isDefault: isFirst}];
    saveUpiIds(updatedList);
    setNewUpi('');
    setIsModalVisible(false);
    ToastAndroid.show('UPI ID Added Successfully', ToastAndroid.SHORT);
  };

  const setDefaultUpi = (id) => {
    const updatedList = upiIds.map((item) => ({
      ...item,
      isDefault: item.id === id,
    }));
    saveUpiIds(updatedList);
  };

  const deleteUpi = (id) => {
      Alert.alert(
          "Delete UPI ID",
          "Are you sure you want to delete this UPI ID?",
          [
              { text: "Cancel", style: "cancel" },
              {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => {
                      const updatedList = upiIds.filter(item => item.id !== id);
                      // If we deleted the default one, make the first one default
                      if (updatedList.length > 0 && !updatedList.some(item => item.isDefault)) {
                          updatedList[0].isDefault = true;
                      }
                      saveUpiIds(updatedList);
                  }
              }
          ]
      );
  };

  return (
    <Layout>
      <SecondaryHeader title="Payment Details" isSearch={false} />
      <View style={styles.screen}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {/* Keep this heading available for later use.
          <Text style={styles.sectionTitle}>Your UPI IDs</Text>
          */}

          {upiIds.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <MaterialIcons
                  name="qr-code-scanner"
                  size={icon(40)}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.emptyText}>No UPI IDs yet</Text>
              <Text style={styles.emptyDescription}>
                Add a UPI ID to keep your payment details handy.
              </Text>
            </View>
          ) : (
            upiIds.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.upiCard, item.isDefault && styles.defaultCard]}
                onPress={() => setDefaultUpi(item.id)}>
                <View style={styles.upiInfo}>
                  <Text style={styles.upiText}>{item.upi}</Text>
                  {item.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
                <View style={styles.actionContainer}>
                    <TouchableOpacity onPress={() => deleteUpi(item.id)} style={styles.deleteIcon}>
                        <Ionicons name="trash-outline" size={icon(20)} color={colors.error} />
                    </TouchableOpacity>
                    <View style={styles.radioOuter}>
                        {item.isDefault && <View style={styles.radioInner} />}
                    </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {upiIds.length === 0 && (
          <TouchableOpacity
            style={styles.floatingAddButton}
            onPress={() => setIsModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Add UPI ID">
            <Text style={styles.addButtonText}>Add UPI ID</Text>
            <Ionicons name="add" size={icon(20)} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <CommonModal
        visible={isModalVisible}
        handleClose={() => setIsModalVisible(false)}
        title="Add New UPI ID">
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Enter UPI ID</Text>
          <SimpleTextInput
            placeholder="e.g. 1234567890@apl"
            value={newUpi || newUpi} // wait, let's keep it clean
            setValue={setNewUpi}
            hasError={newUpi.length > 0 && !/^[\w.-]+@[\w.-]+$/.test(newUpi.trim())}
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleAddUpi}>
            <Text style={styles.saveButtonText}>Save UPI ID</Text>
          </TouchableOpacity>
        </View>
      </CommonModal>
    </Layout>
  );
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: padding(16),
    flexGrow: 1,
  },
  floatingAddButton: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: padding(24),
    backgroundColor: colors.sucess,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: padding(18),
    height: icon(46),
    borderRadius: icon(30),
    gap: padding(10),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: font(16),
    fontFamily: fonts.Bold,
    marginLeft: margin(8),
  },
  sectionTitle: {
    fontSize: font(18),
    fontFamily: fonts.Bold,
    color: colors.text,
    marginBottom: margin(12),
  },
  upiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: padding(16),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginBottom: margin(12),
    backgroundColor: colors.white,
  },
  defaultCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  upiInfo: {
    flex: 1,
  },
  upiText: {
    fontSize: font(16),
    fontFamily: fonts.SemiBold,
    color: colors.text,
  },
  defaultBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: padding(8),
    paddingVertical: padding(2),
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: margin(4),
  },
  defaultBadgeText: {
    color: colors.white,
    fontSize: font(10),
    fontFamily: fonts.Bold,
  },
  actionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  deleteIcon: {
      marginRight: margin(15),
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: padding(50),
  },
  emptyIconWrap: {
    width: icon(80),
    height: icon(80),
    borderRadius: icon(56),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '12',
    marginBottom: margin(20),
  },
  emptyText: {
    fontSize: font(15),
    color: colors.text,
    fontFamily: fonts.Bold,
  },
  emptyDescription: {
    maxWidth: '78%',
    marginTop: margin(8),
    color: colors.textGrey,
    fontSize: font(12),
    fontFamily: fonts.Medium,
    textAlign: 'center',
  },
  modalContent: {
    padding: padding(20),
  },
  modalTitle: {
    fontSize: font(18),
    fontFamily: fonts.Bold,
    color: colors.text,
    marginBottom: margin(15),
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: padding(14),
    borderRadius: 8,
    alignItems: 'center',
    marginTop: margin(20),
  },
  saveButtonText: {
    color: colors.white,
    fontSize: font(16),
    fontFamily: fonts.Bold,
  },
});

export default PaymentDetails;
