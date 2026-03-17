import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useRef, useState} from 'react';
import {font, icon, margin, padding} from '../../utils/responsive';
import {fonts} from '../../utils/fonts';
import {colors} from '../../utils/colors';
import Octicons from '@react-native-vector-icons/octicons';
import DottedDivider from '../Dividers/DottedDivider';
import ToastContainer from '../Toasts/ToastContainer';

const MAIN_UNITS = [
  // Most commonly used weight/volume units in Indian retail, grocery, wholesale, FMCG, and pharma
  {label: 'KG', value: 'kg'}, // Universal for groceries, produce, bulk
  {label: 'KILOGRAMS', value: 'kgs'}, // Common variant
  {label: 'G', value: 'g'}, // Spices, small quantities, pharma
  {label: 'GRAM', value: 'gm'}, // Alternative for grams
  {label: 'MG', value: 'mg'}, // Milligrams - essential for pharmaceuticals
  {label: 'QUINTAL', value: 'quintal'}, // Wholesale agriculture (100 kg)
  {label: 'LITRE', value: 'ltr'}, // Oils, milk, liquids
  {label: 'ML', value: 'ml'}, // Millilitres - pharma, small volumes
  {label: 'TON', value: 'ton'}, // Bulk trade
  {label: 'TONNE', value: 'tonne'}, // Metric ton

  // Counting and packaging units (retail, e-commerce, FMCG, wholesale)
  {label: 'PCS', value: 'pcs'}, // Pieces - most common for individual items
  {label: 'PACK', value: 'pack'}, // Biscuits, soaps, etc.
  {label: 'BOX', value: 'box'},
  {label: 'CARTON', value: 'carton'}, // Wholesale packs
  {label: 'BOTTLE', value: 'bottle'},
  {label: 'POUCH', value: 'pouch'}, // Very popular in modern FMCG (spices, snacks)
  {label: 'BAG', value: 'bag'},
  {label: 'DOZEN', value: 'dozen'},
  {label: 'BUNDLE', value: 'bundle'}, // Vegetables, construction rods
  {label: 'CASE', value: 'case'}, // Wholesale/FMCG packaging
  {label: 'TRAY', value: 'tray'}, // Eggs, fruits

  // Other common packaging (FMCG, chemicals, industrial)
  {label: 'CAN', value: 'can'},
  {label: 'TIN', value: 'tin'},
  {label: 'TUBE', value: 'tube'}, // Creams, pharma
  {label: 'JAR', value: 'jar'},
  {label: 'BAG-IN-BOX', value: 'bag_in_box'},
  {label: 'DRUM', value: 'drum'}, // Chemicals, industrial
  {label: 'BARREL', value: 'barrel'}, // Oils, chemicals

  // Length and fabric units (textiles, construction, retail)
  {label: 'METER', value: 'mtr'}, // Fabrics, pipes, construction
  {label: 'YDS', value: 'yds'}, // Yards for fabrics
  {label: 'KM', value: 'km'},

  // Area units (real estate, construction, land)
  {label: 'SQUARE FEET', value: 'sqft'}, // Dominant for built-up area, apartments
  {label: 'SQUARE YARD', value: 'sqyd'},
  {label: 'GAJ', value: 'gaj'}, // Common synonym for sqyd in North India
  {label: 'SQUARE METER', value: 'sqm'}, // Official metric

  // Land measurement units (agriculture, real estate)
  {label: 'ACRE', value: 'acre'},
  {label: 'HECTARE', value: 'hectare'},
  {label: 'BIGHAA', value: 'bigha'},
  {label: 'CENT', value: 'cent'},
  {label: 'GUNTHA', value: 'guntha'},
  {label: 'GUNTI', value: 'gunti'},
  {label: 'GROUND', value: 'ground'},
  {label: 'KATHA', value: 'katha'},
  {label: 'ANKANAM', value: 'ankanam'},
  {label: 'MARLA', value: 'marla'},
  {label: 'KANAL', value: 'kanal'},
  {label: 'BISWA', value: 'biswa'},
  {label: 'DHUR', value: 'dhur'},

  // Construction-specific bulk units
  {label: 'CUBIC METER', value: 'cum'}, // Concrete, sand
  {label: 'CFT', value: 'cft'}, // Cubic feet - common for aggregates
  {label: 'BRASS', value: 'brass'}, // Traditional for sand/aggregates (100 cft)

  // Niche or less common
  {label: 'POUNDS', value: 'lbs'},
  {label: 'KILOLITRE', value: 'kl'},
  {label: 'ROLL', value: 'roll'}, // Fabrics, wires
  {label: 'BAG (SACK)', value: 'sack'},
  {label: 'CRATE', value: 'crate'},
  {label: 'SET', value: 'set'},
  {label: 'PAIR', value: 'pair'},
  {label: 'REEL', value: 'reel'},
  {label: 'COIL', value: 'coil'},
  {label: 'SHEET', value: 'sheet'},
];

const ProductUnitModal = ({
  visible = false,
  handleCancel = () => {},
  value,
  setValue,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const sortedUnits = React.useMemo(() => {
    if (query) {
      return MAIN_UNITS.filter(
        u =>
          u.label.toLowerCase().includes(query.toLowerCase()) ||
          u.value.toLowerCase().includes(query.toLowerCase()),
      );
    }
    if (!value) return MAIN_UNITS;

    const selected = MAIN_UNITS.find(u => u.label === value);
    const rest = MAIN_UNITS.filter(u => u.label !== value);

    return selected ? [selected, ...rest] : MAIN_UNITS;
  }, [value, query]);

  return (
    <Modal visible={visible} animationType="slide">
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
            return (
              <TouchableOpacity
                style={styles.itemCOntainer}
                onPress={() => {
                  setValue(item.label);
                  handleCancel();
                }}>
                <Text style={styles.itemText}>{item.label}</Text>
                {value === item.label && (
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
