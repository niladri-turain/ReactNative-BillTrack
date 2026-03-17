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
}) => {
  const [query, setQuery] = useState('');
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const previousQueryRef = useRef('');
  const abortControllerRef = useRef(null);

  // Cancel ongoing requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // Debounced search function
  const handleSearch = useCallback(
    debounce(async searchText => {
      if (searchText === previousQueryRef.current) return;
      previousQueryRef.current = searchText;

      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      if (!searchText.trim()) {
        setData([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const response = await hsnService.search(searchText, {
          signal: abortControllerRef.current.signal,
        });
        if (response.status && !abortControllerRef.current.signal.aborted) {
          setData(response.data);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setData([]);
        }
      } finally {
        if (!abortControllerRef.current.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 300),
    [],
  );

  // Trigger search whenever query changes
  useEffect(() => {
    if (query !== previousQueryRef.current && query) handleSearch(query);
  }, [query, handleSearch]);

  // Memoized sorted data: selected item always on top
  const sortedData = useMemo(() => {
    if (!data.length) return [];
    if (!value || !data.find(item => item.id === value.id)) return data;

    const selectedItem = data.find(item => item.id === value.id);
    const otherItems = data.filter(item => item.id !== value.id);
    return selectedItem ? [selectedItem, ...otherItems] : data;
  }, [data, value]);

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
        {query ? 'No HSN found' : 'Start typing to search HSN codes'}
      </Text>
    );
  }, [query, isLoading]);

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
