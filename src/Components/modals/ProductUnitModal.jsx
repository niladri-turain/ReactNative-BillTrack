import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {font, icon, margin, padding} from '../../utils/responsive';
import {fonts} from '../../utils/fonts';
import {colors} from '../../utils/colors';
import Octicons from '@react-native-vector-icons/octicons';
import DottedDivider from '../Dividers/DottedDivider';
import SearchInput from '../Inputs/SearchInput';

const ProductUnitModal = ({
  visible = false,
  handleCancel = () => {},
  value,
  setValue,
  units = [],
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (visible) {
      setQuery('');
    }
  }, [visible]);

  const unitsWithSelectedValue = React.useMemo(() => {
    const normalizedValue = String(value || '').trim().toUpperCase();
    if (!normalizedValue) return units;

    const selectedUnitExists = units.some(
      unit =>
        String(unit?.name || '').trim().toUpperCase() === normalizedValue ||
        String(unit?.shortName || '').trim().toUpperCase() === normalizedValue,
    );

    if (selectedUnitExists) return units;

    const displayName =
      normalizedValue === 'NA'
        ? 'NA'
        : normalizedValue.charAt(0) + normalizedValue.slice(1).toLowerCase();

    return [{name: displayName, shortName: normalizedValue}, ...units];
  }, [value, units]);

  const sortedUnits = React.useMemo(() => {
    let filteredUnits = unitsWithSelectedValue;

    if (query) {
      filteredUnits = unitsWithSelectedValue.filter(
        u =>
          (u.name && u.name.toLowerCase().includes(query.toLowerCase())) ||
          (u.shortName && u.shortName.toLowerCase().includes(query.toLowerCase())),
      );
    }

    if (!value) return filteredUnits;

    const normalizedValue = String(value).trim().toUpperCase();
    const matchesSelectedValue = unit =>
      String(unit?.name || '').trim().toUpperCase() === normalizedValue ||
      String(unit?.shortName || '').trim().toUpperCase() === normalizedValue;
    const selected = filteredUnits.find(matchesSelectedValue);
    const rest = filteredUnits.filter(
      unit => !matchesSelectedValue(unit),
    );

    return selected ? [selected, ...rest] : filteredUnits;
  }, [value, query, unitsWithSelectedValue]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleCancel}
      >
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerText}>Select a Unit</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <SearchInput
            placeholder="Search"
            value={query}
            setValue={setQuery}
          />
        </View>

        <FlatList
          style={{
            backgroundColor: '#00000003',
            marginVertical: margin(10),
            borderRadius: icon(5),
            marginHorizontal: margin(16),
            paddingBottom: padding(10),
          }}
          data={sortedUnits}
          keyExtractor={(_, index) => index + 'unit_flatlist'}
          renderItem={({item}) => {
            const normalizedValue = String(value || '').trim().toUpperCase();
            const isSelected =
              normalizedValue &&
              (String(item?.name || '').trim().toUpperCase() === normalizedValue ||
                String(item?.shortName || '').trim().toUpperCase() === normalizedValue);
            return (
              <TouchableOpacity
                style={styles.itemCOntainer}
                onPress={() => {
                  setValue(item.shortName || item.name);
                  handleCancel();
                }}>
                <Text style={styles.itemText}>{item.name} {item.shortName ? `(${item.shortName})` : ''}</Text>
                {isSelected && (
                  <Octicons name="check" size={icon(20)} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.contentContainer}
          ItemSeparatorComponent={() => <DottedDivider marginVertical={0} />}
          ListEmptyComponent={() => (
            <Text style={{textAlign: 'center', marginTop: 20, fontFamily: fonts.inRegular, color: '#666'}}>
              No units found
            </Text>
          )}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    padding: padding(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cancelBtn: {
    backgroundColor: colors.primary,
    paddingVertical: padding(6),
    paddingHorizontal: padding(10),
    borderRadius: 5,
    minWidth: 60,
  },
  cancelText: {
    color: '#fff',
    fontFamily: fonts.inMedium,
    fontSize: font(14),
    textAlign: 'center',
  },
  headerText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.inSemiBold,
    fontSize: font(16),
  },
  placeholder: {width: 60},
  contentContainer: {
    flexGrow: 1,
  },
  itemCOntainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: padding(15),
    paddingHorizontal: padding(16),
  },
  itemText: {
    fontSize: font(14),
    fontFamily: fonts.inMedium,
  },
  searchContainer: {
    marginHorizontal: margin(16), 
    marginBottom: margin(10),
    marginTop: margin(10),
  },
});

export default ProductUnitModal;
