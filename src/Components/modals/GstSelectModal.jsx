import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useEffect, useState, useMemo, useRef} from 'react';
import {font, gap, icon, margin, padding} from '../../utils/responsive';
import {fonts} from '../../utils/fonts';
import {colors} from '../../utils/colors';
import Octicons from '@react-native-vector-icons/octicons';
import DottedDivider from '../Dividers/DottedDivider';
import SearchInput from '../Inputs/SearchInput';
import {hsnService} from '../../Services/HsnService';
import debounce from 'lodash.debounce';

// Memoized components to prevent unnecessary re-renders
const MemoizedSearchInput = React.memo(SearchInput);
const MemoizedDottedDivider = React.memo(DottedDivider);
// const MemoizedListItem = React.memo(({item, isSelected, onSelect}) => (
//   <TouchableOpacity
//     style={styles.itemContainer}
//     onPress={onSelect}
//     delayPressIn={0}>
//     <Text style={styles.itemText} numberOfLines={2}>
//       {`${item.hsnCode} - ${item.description} | CGST: ${item.cGst}% | SGST: ${item.sGst}% | IGST: ${item.iGst}%`}
//     </Text>
//     {isSelected && <Octicons name="check" size={20} color="#000" />}
//   </TouchableOpacity>
// ));

const MemoizedListItem = React.memo(({item, isSelected, onSelect}) => (
  <TouchableOpacity
    style={styles.itemContainer}
    onPress={onSelect}
    delayPressIn={0}>
    <View style={styles.hsnItemContainer}>
      <Text style={styles.hsnText}>{item.hsnCode}</Text>
      {isSelected && <Octicons name="check" size={24} color={colors.primary} />}
    </View>
    <Text style={styles.hsnDescription}>{item.description}</Text>
    <View style={styles.gstContainer}>
      <Text style={styles.gstText}>CGST {item.cGst}%</Text>
      <Text style={styles.gstText}>SGST {item.sGst}%</Text>
      <Text style={styles.gstText}>IGST {item.iGst}%</Text>
    </View>
    {/* <Text style={styles.itemText} numberOfLines={2}>
      {`${item.hsnCode} - ${item.description} | CGST: ${item.cGst}% | SGST: ${item.sGst}% | IGST: ${item.iGst}%`}
    </Text>
    {isSelected && <Octicons name="check" size={20} color="#000" />} */}
  </TouchableOpacity>
));

const GstSelectModal = ({
  visible = false,
  handleCancel = () => {},
  value,
  setValue,
  token,
  businessCategoryId,
}) => {
  const [query, setQuery] = useState('');
  const [allData, setAllData] = useState([]);
  const [isGlobalMode, setIsGlobalMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch HSNs when modal opens
  useEffect(() => {
    const fetchHsns = async () => {
      if (!visible || !token || !businessCategoryId) return;

      setIsLoading(true);
      try {
        const response = await hsnService.getHsnByBusinessCategory(
          token,
          businessCategoryId,
        );
        if (response.success) {
          const hsns = (response.data?.hsns || []).map(item => item.hsn);

          if (hsns.length === 0) {
            // Category empty -> Switch to Global Mode
            setIsGlobalMode(true);
            const globalSearchResponse = await hsnService.search('');
            if (globalSearchResponse.status) {
              setAllData(globalSearchResponse.data);
            }
          } else {
            // Category has data -> Stay in Local Mode
            setIsGlobalMode(false);
            setAllData(hsns);
          }
        }
      } catch (error) {
        console.error('Failed to fetch HSNs:', error);
        setAllData([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (visible) {
      setQuery('');
      fetchHsns();
    }
  }, [visible, token, businessCategoryId]);

  // Global search implementation
  const handleGlobalSearch = useCallback(
    debounce(async searchText => {
      setIsLoading(true);
      try {
        const response = await hsnService.search(searchText);
        if (response.status) {
          setAllData(response.data);
        }
      } catch (error) {
        console.error('Global search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    [],
  );

  // Trigger search from API ONLY IF in Global Mode
  useEffect(() => {
    if (isGlobalMode && query.trim() !== '') {
      handleGlobalSearch(query);
    } else if (isGlobalMode && query.trim() === '') {
      handleGlobalSearch(''); // Reset to initial global list
    }
  }, [query, isGlobalMode, handleGlobalSearch]);

  // Local filtering for Category mode, or direct data for Global mode
  const filteredData = useMemo(() => {
    if (isGlobalMode) return allData;

    if (!query.trim()) return allData;
    const lowerQuery = query.toLowerCase();
    return allData.filter(
      item =>
        item.hsnCode?.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery),
    );
  }, [allData, query, isGlobalMode]);

  // Memoized sorted data: selected item always on top
  const sortedData = useMemo(() => {
    if (!filteredData.length) return [];
    if (!value || !filteredData.find(item => item.id === value.id))
      return filteredData;

    const selectedItem = filteredData.find(item => item.id === value.id);
    const otherItems = filteredData.filter(item => item.id !== value.id);
    return selectedItem ? [selectedItem, ...otherItems] : filteredData;
  }, [filteredData, value]);

  // Memoized item renderer
  const renderItem = useCallback(
    ({item}) => (
      <MemoizedListItem
        item={item}
        isSelected={value?.id === item.id}
        onSelect={() => {
          setValue(item);
          handleCancel();
        }}
      />
    ),
    [value, setValue, handleCancel],
  );

  // Memoized empty component
  const ListEmptyComponent = useCallback(() => {
    if (isLoading) return null;
    return (
      <Text style={styles.emptyText}>
        No HSN found
      </Text>
    );
  }, [isLoading]);

  // Optimized key extractor
  const keyExtractor = useCallback(
    item => `hsn-${item.id}-${item.hsnCode}`,
    [],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleCancel}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerText}>Select a HSN</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search Input: outside FlatList to avoid focus loss */}
        <View style={styles.searchContainer}>
          <MemoizedSearchInput
            placeholder="Search"
            value={query}
            setValue={setQuery}
          />
          {isLoading && <Text style={styles.loadingText}>Searching...</Text>}
        </View>

        {/* HSN List */}
        <FlatList
          style={styles.flatList}
          data={sortedData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.contentContainer}
          ItemSeparatorComponent={() => (
            <MemoizedDottedDivider marginVertical={0} />
          )}
          ListEmptyComponent={ListEmptyComponent}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={21}
          removeClippedSubviews={true}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  headerContainer: {
    padding: padding(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cancelBtn: {
    // backgroundColor: '#000',
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
  searchContainer: {marginHorizontal: margin(16), marginBottom: margin(10)},
  flatList: {
    backgroundColor: '#00000003',
    marginVertical: margin(10),
    borderRadius: icon(5),
    marginHorizontal: margin(16),
  },
  contentContainer: {flexGrow: 1},
  itemContainer: {
    // flexDirection: 'row',
    // justifyContent: 'space-between',
    // alignItems: 'center',
    paddingVertical: padding(12),
    paddingHorizontal: padding(16),
    minHeight: 44,
    gap: gap(5),
    backgroundColor: '#fff',
  },
  itemText: {
    flex: 1,
    fontSize: font(14),
    fontFamily: fonts.inMedium,
    lineHeight: font(18),
    marginRight: margin(8),
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: margin(20),
    color: '#00000080',
    fontSize: font(16),
    fontFamily: fonts.inMedium,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: margin(8),
    color: '#00000060',
    fontSize: font(14),
    fontFamily: fonts.inRegular,
  },
  hsnItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gstContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: gap(10),
    marginVertical: margin(10),
  },
  hsnText: {
    fontSize: font(16),
    fontFamily: fonts.inBold,
    color: colors.primary,
  },
  hsnDescription: {
    fontSize: font(14),
    fontFamily: fonts.inMedium,
    color: '#00000090',
  },
  gstText: {
    backgroundColor: colors.primary + 25,
    paddingVertical: padding(5),
    paddingHorizontal: padding(10),
    borderRadius: icon(20),
    color: colors.primary,
    fontFamily: fonts.inBold,
    fontSize: font(12),
  },
});

export default React.memo(GstSelectModal);
