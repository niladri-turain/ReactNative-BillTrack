import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {Layout} from '../../Layout';
import {CommonModal, RadioInput, SecondaryHeader} from '../../../Components';
import ScanLoader from '../../../Components/Loaders/ScanLoader';
import printerService from '../../../utils/PrinterService';
import {font, gap, icon, margin, padding} from '../../../utils/responsive';
import {usePrinter} from '../../../Contexts/PrinterContext';
import ToastService from '../../../Components/Toasts/ToastService';
import {fonts} from '../../../utils/fonts';
import {colors} from '../../../utils/colors';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

const PrinterSetup = () => {
  const {printer, setSelectedPrinter, setAsDefaultPrinter} = usePrinter();

  // Data States
  const [printers, setPrinters] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(printer);
  const [printerSize, setPrinterSize] = useState(printer?.printerSize || '58');
  const [saveType, setSaveType] = useState('default');

  // Modal States
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Loading State
  const [isLoading, setIsLoading] = useState(true);
  const [isSetLoading, setIsSetLoading] = useState(false);

  const detectDevices = async () => {
    try {
      setIsLoading(true);
      const devices = await printerService.detectDevices();
      setPrinters(devices);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    detectDevices();
  }, []);

  const renderDevice = ({item}) => {
    const isSelected = selectedDevice?.address === item.address;

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.selectedCard]}
        onPress={() => setSelectedDevice(item)}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceAddress}>{item.address}</Text>
      </TouchableOpacity>
    );
  };

  const handelSetAsDefault = async () => {
    try {
      setIsSetLoading(true);
      if (!selectedDevice)
        return ToastService.show({
          message: 'Select a printer first',
          type: 'error',
          position: 'top',
        });
      const savablePrinter = {
        ...selectedDevice,
        printerSize: printerSize,
      };
      await setAsDefaultPrinter(savablePrinter);
      ToastService.show({
        message: 'Default printer set successfully',
        type: 'success',
        position: 'top',
      });
    } catch (error) {
    } finally {
      setIsSetLoading(false);
      handleCloseModal();
    }
  };

  const handleSetPrinter = async () => {
    if (!selectedDevice)
      return ToastService.show({
        message: 'Select a printer first',
        type: 'error',
        position: 'top',
      });
    try {
      setIsSetLoading(true);
      const finalSetablePrinter = {
        ...selectedDevice,
        printerSize: printerSize,
      };
      setSelectedPrinter(finalSetablePrinter);
      ToastService.show({
        message: 'Printer set successfully',
        type: 'success',
        position: 'top',
      });
    } catch (error) {
    } finally {
      setIsSetLoading(false);
      handleCloseModal();
    }
  };

  const handleOpenModal = () => setIsModalVisible(true);
  const handleCloseModal = () => setIsModalVisible(false);

  const handleSetMainPrinter = () => {
    if (saveType === 'default') {
      handelSetAsDefault();
    } else {
      handleSetPrinter();
    }
  };

  return (
    <Layout>
      <SecondaryHeader
        title="Printer Setup"
        isSearch={false}
        isQuestion={false}
        isNotification={false}
      />
      {isLoading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ScanLoader />
        </View>
      ) : (
        <FlatList
          style={{flex: 1}}
          contentContainerStyle={styles.container}
          data={printers}
          keyExtractor={(_, index) => index + 'contents'}
          renderItem={renderDevice}
          ListEmptyComponent={
            <View style={styles.emptyComponent}>
              <MaterialDesignIcons name="printer-off" size={icon(100)} />
              <Text style={styles.emptyText}>No printer found</Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={detectDevices}>
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          disabled={isLoading}
          onPress={() => {
            if (!selectedDevice)
              return ToastService.show({
                message: 'Select a printer first',
                type: 'error',
                position: 'top',
              });
            handleOpenModal();
            setSaveType('default');
          }}
          style={{
            backgroundColor: '#007AFF',
            paddingHorizontal: padding(16),
            paddingVertical: padding(12),
            borderRadius: 12,
          }}>
          <Text
            style={{
              fontSize: font(16),
              fontWeight: 'bold',
              color: '#fff',
              textAlign: 'center',
            }}>
            Set as Default
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={isLoading}
          onPress={() => {
            if (!selectedDevice)
              return ToastService.show({
                message: 'Select a printer first',
                type: 'error',
                position: 'top',
              });
            handleOpenModal();
            setSaveType('temporary');
          }}
          style={{
            backgroundColor: '#007AFF',
            paddingHorizontal: padding(16),
            paddingVertical: padding(12),
            borderRadius: 12,
          }}>
          <Text
            style={{
              fontSize: font(16),
              fontWeight: 'bold',
              color: '#fff',
              textAlign: 'center',
            }}>
            Set Printer
          </Text>
        </TouchableOpacity>
      </View>
      <CommonModal visible={isModalVisible}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Printer Size</Text>
          <View style={styles.radioContainer}>
            <RadioInput
              value="58"
              label="58mm"
              setValue={setPrinterSize}
              isSelected={printerSize === '58'}
            />
            <RadioInput
              value="80"
              label="80mm"
              setValue={setPrinterSize}
              isSelected={printerSize === '80'}
            />
            <RadioInput
              value="104"
              label="104mm"
              setValue={setPrinterSize}
              isSelected={printerSize === '104'}
            />
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleCloseModal}
              style={[styles.button, {backgroundColor: colors.error + 80}]}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              disabled={isSetLoading}
              onPress={handleSetMainPrinter}>
              {isSetLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnText}>Set Preference</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </CommonModal>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: padding(16),
  },
  card: {
    padding: padding(16),
    borderRadius: 12,
    backgroundColor: '#F4F4F4',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ccc',
  },

  selectedCard: {
    backgroundColor: '#D1E7FF',
    borderColor: '#007AFF',
  },

  deviceName: {
    fontSize: font(16),
    fontWeight: 'bold',
    color: '#000',
  },

  deviceAddress: {
    fontSize: font(14),
    color: '#555',
    marginTop: 4,
  },
  bottomButtonContainer: {
    paddingHorizontal: padding(16),
    paddingVertical: padding(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: padding(16),
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: font(16),
    fontFamily: fonts.inBold,
  },
  radioContainer: {
    marginVertical: margin(5),
    gap: gap(10),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: margin(15),
    gap: gap(10),
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: padding(16),
    paddingVertical: padding(8),
    borderRadius: 12,
  },
  btnText: {
    color: '#fff',
    fontSize: font(16),
    fontFamily: fonts.inSemiBold,
  },
  emptyComponent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: font(16),
    fontFamily: fonts.inRegular,
    color: '#000',
  },
  refreshButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: padding(16),
    paddingVertical: padding(8),
    borderRadius: 8,
    marginVertical: margin(10),
  },
  refreshButtonText: {
    fontSize: font(14),
    fontFamily: fonts.inSemiBold,
    color: '#fff',
  },
});

export default PrinterSetup;
