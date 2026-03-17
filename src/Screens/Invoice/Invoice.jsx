import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Layout} from '../Layout';
import {
  DottedDivider,
  EmptyListCard,
  InvoiceCard,
  InvoiceCardShimmer,
  Loader,
  RadioInput,
  SecondaryHeader,
} from '../../Components';
import Lucide from '@react-native-vector-icons/lucide';
import {colors} from '../../utils/colors';
import {fonts} from '../../utils/fonts';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import Ionicons from '@react-native-vector-icons/ionicons';
import {font, margin, padding} from '../../utils/responsive';
import {invoiceService} from '../../Services/InvoiceService';
import {useAuthToken, useSubscription} from '../../Contexts/AuthContext';

// Constants moved outside component to prevent recreation
const SNAP_POINTS = ['50%'];
const SHIMMER_DATA = [1, 2, 3];
const SORT_OPTIONS = [
  { label: 'Newest First', value: 'date_desc' },
  { label: 'Oldest First', value: 'date_asc' },
  { label: 'Amount High to Low', value: 'amount_high_to_low' },
  { label: 'Amount Low to High', value: 'amount_low_to_high' },
];
const STICKY_HEADER_INDICES = [0];
const ANIMATION_CONFIG = {duration: 300};

// Memoized ListFooterComponent
const ListFooterComponent = memo(({isLoading, paginationHasNextPage}) =>
  paginationHasNextPage && isLoading ? (
    <View style={styles.footerLoader}>
      <Loader />
    </View>
  ) : null,
);

// Memoized SortOption Component
const SortOption = memo(({label, value, isSelected, onSelect, isLast}) => (
  <>
    <View style={styles.bottomSheetBottom}>
      <RadioInput
        label={label}
        value={value}
        setValue={onSelect}
        isSelected={isSelected}
        height={45}
      />
    </View>
    {!isLast && <DottedDivider marginVertical={0} />}
  </>
));

const Invoice = () => {
  const token = useAuthToken();
  const subscription = useSubscription();

  // STATE VARIABLES
  const [sortBy, setSortBy] = useState('date_desc');
  const [pageNumber, setPageNumber] = useState(0);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [paginationTotalPage, setPaginationTotalPage] = useState(0);
  const [paginationHasNextPage, setPaginationHasNextPage] = useState(false);
  const [query, setQuery] = useState('');

  const bottomSheetRef = useRef(null);

  // Memoized callbacks
  const handleOpenBottomSheet = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const handleCloseBottomSheet = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.8}
      />
    ),
    [],
  );

  /* FETCH INVOICES OPTIMIZATION */
  const fetchInvoices = useCallback(
    async (page = 0) => {
      try {
        setIsLoading(true);
        const data = await invoiceService.getInvoices(token, page, 8, sortBy);
        if (data?.status) {
          setInvoices(data?.data);
          const pagination = data?.pagination;
          setPaginationTotalPage(pagination?.totalPage);
          setPaginationHasNextPage(pagination?.hasNext);
          console.log(JSON.stringify(data.data))
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    },
    [token,sortBy],
  );

  const fetchMore = useCallback(
    async nextPage => {
      if (isLoading) return;

      try {
        setIsLoading(true);
        const data = await invoiceService.getInvoices(token, nextPage, 8,sortBy);
        if (data?.status) {
          setInvoices(prev => [...prev, ...data?.data]);
          const pagination = data?.pagination;
          setPaginationTotalPage(pagination?.totalPage);
          setPaginationHasNextPage(pagination?.hasNext);
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    },
    [token, isLoading],
  );

  useEffect(() => {
    if (pageNumber === 0) {
      fetchInvoices(0);
    } else {
      fetchMore(pageNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber]);

  /* ON REFRESH OPTIMIZATION */
  const onRefresh = useCallback(async () => {
    setPageNumber(0);
    setIsRefreshing(true);
    await fetchInvoices(0);
    setIsRefreshing(false);
    setSortBy('date_desc');
  }, [fetchInvoices]);

  const onEndReached = useCallback(() => {
    if (paginationHasNextPage && !isLoading && invoices.length > 0) {
      setPageNumber(prev => prev + 1);
    }
  }, [paginationHasNextPage, isLoading, invoices.length]);

  // Memoized header component
  const ListHeaderComponent = useMemo(
    () => (
      <View style={styles.topHeader}>
        <Text style={styles.titleText}>All Invoice List</Text>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={handleOpenBottomSheet}>
          <Text style={styles.sortText}>Sort</Text>
          <Lucide name="arrow-down-up" size={12} color={colors.primary} />
        </TouchableOpacity>
      </View>
    ),
    [handleOpenBottomSheet],
  );

  // Optimized render functions
  const keyExtractor = useCallback(
    (item, index) => `${item?.id || index}_invoice_items`,
    [],
  );

  /* RENDER ITEM OPTIMIZATION */
  const renderItem = useCallback(
    ({item}) =>
      typeof item === 'number' ? (
        <InvoiceCardShimmer />
      ) : (
        <InvoiceCard invoice={item} />
      ),
    [],
  );

  const renderSortOption = useCallback(
    ({item, index}) => (
      <SortOption
        label={item.label}
        value={item.value}
        isSelected={sortBy === item.value}
        onSelect={setSortBy}
        isLast={index === SORT_OPTIONS.length - 1}
      />
    ),
    [sortBy],
  );

  const sortOptionsKeyExtractor = useCallback(
    (item, index) => `${item.value}_${index}`,
    [],
  );

  const renderFooter = useCallback(
    () => (
      <ListFooterComponent
        isLoading={isLoading}
        paginationHasNextPage={paginationHasNextPage}
      />
    ),
    [isLoading, paginationHasNextPage],
  );

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        colors={[colors.primary, colors.sucess, colors.error]}
        tintColor={colors.primary}
      />
    ),
    [isRefreshing, onRefresh],
  );

  const handleChangeText = useCallback(text => {
    setQuery(text);
  }, []);

  /* FILTERED INVOICES OPTIMIZATION */
  const filteredInvoices = useMemo(() => {
    const data = isLoading && pageNumber === 0 ? SHIMMER_DATA : invoices;

    // Safety check: specific handling for SHIMMER_DATA to avoid property access on numbers
    if (data === SHIMMER_DATA) return SHIMMER_DATA;
    if (!query) return data;

    return data.filter(invoice =>
      invoice?.invoiceNumber?.toLowerCase().includes(query.toLowerCase()) || invoice?.customerNumber?.toLowerCase().includes(query.toLowerCase()),
    );
  }, [isLoading, pageNumber, invoices, query]);

  const applySorting=async()=>{
    setPageNumber(0);
    setIsRefreshing(true);
    await fetchInvoices(0);
    setTimeout(() => {
      bottomSheetRef.current?.close();
    }, 10);
    setIsRefreshing(false);
  }

  return (
    <GestureHandlerRootView style={styles.rootView}>
      <Layout>
        <SecondaryHeader
          title="Invoice list"
          query={query}
          onchangeText={handleChangeText}
          isQuestion={false}
          isRestart={true}
          handleRestartClick={onRefresh}
        />
        <FlatList
          contentContainerStyle={styles.container}
          ListHeaderComponent={ListHeaderComponent}
          data={filteredInvoices}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          stickyHeaderIndices={STICKY_HEADER_INDICES}
          refreshControl={refreshControl}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={5}
          initialNumToRender={5}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={<EmptyListCard title="No Invoice Found" />}
        />
      </Layout>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={SNAP_POINTS}
        index={-1}
        handleComponent={null}
        backdropComponent={renderBackdrop}
        animationConfigs={ANIMATION_CONFIG}
        backgroundStyle={styles.bottomSheetBackground}
        enableOverDrag={false}
        enableHandlePanningGesture={false}>
        <BottomSheetView style={styles.bottomSheetContainer}>
          <View style={styles.bottomSheetTop}>
            <Text style={styles.bottomSheetTopText}>Sorting</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseBottomSheet}>
              <Ionicons name="close" size={26} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={SORT_OPTIONS}
            keyExtractor={sortOptionsKeyExtractor}
            renderItem={renderSortOption}
          />
          <TouchableOpacity style={styles.applyButton} onPress={applySorting} 
          disabled={isRefreshing}>
            {isRefreshing?<ActivityIndicator size={'small'} color={'#fff'} />:<Text style={styles.applyText}>APPLY</Text>}
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  rootView: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: 16,
    marginTop: 17,
    marginBottom: 5,
  },
  titleText: {
    fontSize: 14,
    fontFamily: fonts.inMedium,
    color: '#000',
  },
  sortButton: {
    width: 77,
    height: 27,
    backgroundColor: colors.primary + 20,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  sortText: {
    fontSize: 12,
    fontFamily: fonts.onSemiBold,
    color: colors.primary,
  },
  container: {
    paddingHorizontal: 16,
    gap: 15,
    paddingBottom: 50,
  },
  bottomSheetTop: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: colors.primary + 30,
  },
  bottomSheetTopText: {
    fontSize: 14,
    fontFamily: fonts.inSemiBold,
    color: colors.primary,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetBottom: {
    paddingHorizontal: 16,
  },
  bottomSheetContainer: {
    flex: 1,
    gap: 10,
  },
  bottomSheetBackground: {
    borderRadius: 0,
  },
  applyButton: {
    alignSelf: 'center',
    marginBottom: margin(15),
    paddingHorizontal: padding(30),
    paddingVertical: padding(8),
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  applyText: {
    fontSize: font(12),
    fontFamily: fonts.inBold,
    color: '#fff',
  },
  footerLoader: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Invoice;
