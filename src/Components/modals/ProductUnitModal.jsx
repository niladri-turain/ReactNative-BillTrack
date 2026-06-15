import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {font, icon, margin, padding} from '../../utils/responsive';
import {fonts} from '../../utils/fonts';
import {colors} from '../../utils/colors';
import Octicons from '@react-native-vector-icons/octicons';
import DottedDivider from '../Dividers/DottedDivider';

const ProductUnitModal = ({
  visible = false,
  handleCancel = () => {},
  value,
  setValue,
  units = [],
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (visible) {
      setQuery('');
      setIsSearchOpen(false);
    }
  }, [visible]);

  const sortedUnits = React.useMemo(() => {
    if (query) {
      return units.filter(
        u =>
          (u.name && u.name.toLowerCase().includes(query.toLowerCase())) ||
          (u.shortName && u.shortName.toLowerCase().includes(query.toLowerCase())),
      );
    }
    if (!value) return units;

    const selected = units.find(u => 
      (u.name && u.name.toUpperCase() === value.toUpperCase()) || 
      (u.shortName && u.shortName.toUpperCase() === value.toUpperCase())
    );
    const rest = units.filter(u => 
      !(u.name && u.name.toUpperCase() === value.toUpperCase()) && 
      !(u.shortName && u.shortName.toUpperCase() === value.toUpperCase())
    );

    return selected ? [selected, ...rest] : units;
  }, [value, query, units]);

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
          {!isSearchOpen && (
            <Text style={styles.headerText}>Select a Unit</Text>
          )}
          {!isSearchOpen && (
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={() => {
                setIsSearchOpen(true);
              }}>
              <Octicons name="search" size={icon(20)} color={'#000'} />
            </TouchableOpacity>
          )}
          {isSearchOpen && (
            <View style={styles.searchContainer}>
              <TextInput
                placeholder="Search"
                placeholderTextColor={colors.border}
                onChangeText={text => setQuery(text)}
                value={query}
                focusable
              />
              <TouchableOpacity onPress={() => setIsSearchOpen(false)}>
                <Text>cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <FlatList
          style={{
            // flex: 1,
            backgroundColor: '#EAEAEA',
            marginVertical: margin(10),
            borderRadius: icon(10),
            marginHorizontal: margin(16),
            paddingBottom: padding(10),
          }}
          data={sortedUnits}
          keyExtractor={(_, index) => index + 'unit_flatlist'}
          renderItem={({item}) => {
            const isSelected = value && item.name && item.name.toUpperCase() === value.toUpperCase();
            return (
              <TouchableOpacity
                style={styles.itemCOntainer}
                onPress={() => {
                  setValue(item.name);
                  handleCancel();
                }}>
                <Text style={styles.itemText}>{item.name} {item.shortName ? `(${item.shortName})` : ''}</Text>
                {isSelected && (
                  <Octicons name="check" size={icon(20)} color={'#000'} />
                )}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.contentContainer}
          ItemSeparatorComponent={() => <DottedDivider marginVertical={0} />}
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
  },
  cancelBtn: {
    backgroundColor: '#000',
    paddingVertical: padding(6),
    paddingHorizontal: padding(10),
    borderRadius: 5,
  },
  cancelText: {
    color: '#fff',
    fontFamily: fonts.inMedium,
  },
  headerText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.inSemiBold,
  },
  contentContainer: {
    marginVertical: margin(10),
  },
  itemCOntainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: padding(10),
    paddingHorizontal: padding(16),
  },
  itemText: {
    fontSize: font(14),
    fontFamily: fonts.inMedium,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: margin(20),
  },
});

export default ProductUnitModal;
