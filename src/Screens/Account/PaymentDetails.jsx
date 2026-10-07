import React, {useState, useEffect, useCallback, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ToastAndroid,
  Alert,
} from 'react-native';
import {Layout} from '../Layout';
import {SecondaryHeader, SimpleTextInput, CommonModal} from '../../Components';
import {colors} from '../../utils/colors';
import {fonts} from '../../utils/fonts';
import {font, icon, margin, padding} from '../../utils/responsive';
import Ionicons from '@react-native-vector-icons/ionicons';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {useAuthToken} from '../../Contexts/AuthContext';
import {businessUpiService} from '../../Services/BusinessUpiService';

const PaymentDetails = memo(() => {
  const token = useAuthToken();
  const [upiIds, setUpiIds] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newUpi, setNewUpi] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadUpiIds = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await businessUpiService.getUpiIds(token);
      if (response?.status && Array.isArray(response.data)) {
        setUpiIds(response.data);
      } else {
        setUpiIds([]);
        ToastAndroid.show(
          response?.message || 'Unable to load UPI IDs',
          ToastAndroid.LONG,
        );
      }
    } catch (error) {
      console.error('[PaymentDetails] Failed to load UPI IDs:', error);
      ToastAndroid.show('Unable to load UPI IDs', ToastAndroid.LONG);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUpiIds();
  }, [loadUpiIds]);

  const handleAddUpi = async () => {
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

    setIsSaving(true);
    try {
      const response = await businessUpiService.addUpiId({
        token,
        upiId: newUpi.trim(),
        label: newLabel,
      });
      if (response?.status) {
        setNewUpi('');
        setNewLabel('');
        setIsModalVisible(false);
        await loadUpiIds();
        ToastAndroid.show('UPI ID added successfully', ToastAndroid.SHORT);
      } else {
        ToastAndroid.show(response?.message || 'Unable to add UPI ID', ToastAndroid.LONG);
      }
    } catch (error) {
      console.error('[PaymentDetails] Failed to add UPI ID:', error);
      ToastAndroid.show('Unable to add UPI ID', ToastAndroid.LONG);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUpi = id => {
    Alert.alert('Delete UPI ID', 'Are you sure you want to delete this UPI ID?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(id);
          try {
            const response = await businessUpiService.deleteUpiId(token, id);
            if (response?.status) {
              await loadUpiIds();
              ToastAndroid.show(
                response?.message || 'UPI ID deleted successfully',
                ToastAndroid.SHORT,
              );
            } else {
              ToastAndroid.show(
                response?.message || 'Unable to delete UPI ID',
                ToastAndroid.LONG,
              );
            }
          } catch (error) {
            console.error('[PaymentDetails] Failed to delete UPI ID:', error);
            ToastAndroid.show('Unable to delete UPI ID', ToastAndroid.LONG);
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  return (
    <Layout>
      <SecondaryHeader title="Payment Details" isSearch={false} />
      <View style={styles.screen}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {/* Keep this heading available for later use.
          <Text style={styles.sectionTitle}>Your UPI IDs</Text>
          */}

          {isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyDescription}>Loading UPI IDs...</Text>
            </View>
          ) : upiIds.length === 0 ? (
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
            upiIds.map(item => (
              <View
                key={item.id}
                style={[styles.upiCard, item.isDefault && styles.defaultCard]}
              >
                <View style={styles.upiInfo}>
                  <Text style={styles.upiText}>{item.upiId}</Text>
                  {!!item.label && <Text style={styles.upiLabel}>{item.label}</Text>}
                  {item.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
                <View style={styles.actionContainer}>
                  <TouchableOpacity
                    style={styles.deleteIcon}
                    onPress={() => handleDeleteUpi(item.id)}
                    disabled={deletingId === item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${item.upiId}`}>
                    <Ionicons
                      name="trash-outline"
                      size={icon(20)}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                  <View style={styles.radioOuter}>
                    {item.isDefault && <View style={styles.radioInner} />}
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <TouchableOpacity
          style={styles.floatingAddButton}
          onPress={() => setIsModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Add UPI ID">
          <Text style={styles.addButtonText}>Add UPI ID</Text>
          <Ionicons name="add" size={icon(20)} color="#fff" />
        </TouchableOpacity>
      </View>

      <CommonModal
        visible={isModalVisible}
        handleClose={() => setIsModalVisible(false)}
        title="Add New UPI ID">
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Enter UPI ID</Text>
          <View style={styles.upiInputSpacing}>
            <SimpleTextInput
              placeholder="e.g. 1234567890@apl"
              value={newUpi}
              setValue={setNewUpi}
              hasError={newUpi.length > 0 && !/^[\w.-]+@[\w.-]+$/.test(newUpi.trim())}
            />
          </View>
          <SimpleTextInput
            placeholder="Label (e.g. Main account)"
            value={newLabel}
            setValue={setNewLabel}
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleAddUpi}
            disabled={isSaving}>
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save UPI ID'}
            </Text>
          </TouchableOpacity>
        </View>
      </CommonModal>
    </Layout>
  );
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
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
    fontFamily: fonts.inBold,
    marginLeft: margin(8),
  },
  sectionTitle: {
    fontSize: font(18),
    fontFamily: fonts.inBold,
    color: '#111',
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
    backgroundColor: '#fff',
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
    fontFamily: fonts.inSemiBold,
    color: '#111',
  },
  upiLabel: {
    marginTop: margin(4),
    fontSize: font(12),
    color: '#666',
    fontFamily: fonts.inMedium,
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
    color: '#fff',
    fontSize: font(10),
    fontFamily: fonts.inBold,
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
    color: '#111',
    fontFamily: fonts.inBold,
  },
  emptyDescription: {
    maxWidth: '78%',
    marginTop: margin(8),
    color: '#666',
    fontSize: font(12),
    fontFamily: fonts.inMedium,
    textAlign: 'center',
  },
  modalContent: {
    padding: padding(20),
  },
  upiInputSpacing: {
    marginBottom: margin(12),
  },
  modalTitle: {
    fontSize: font(18),
    fontFamily: fonts.inBold,
    color: '#111',
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
    color: '#fff',
    fontSize: font(16),
    fontFamily: fonts.inBold,
  },
});

export default PaymentDetails;
