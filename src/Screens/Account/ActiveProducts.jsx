import React, {useCallback, useEffect, useMemo, useState, memo} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {Layout} from '../Layout';
import {ProductActiveCard, SecondaryHeader} from '../../Components';
import {productService} from '../../Services/ProductService';
import {useAuthToken} from '../../Contexts/AuthContext';
import {useProduct} from '../../Contexts/ProductContexts';
import {colors} from '../../utils/colors';
import {font, gap, padding} from '../../utils/responsive';
import {fonts} from '../../utils/fonts';
import ToastService from '../../Components/Toasts/ToastService';
import {useFocusEffect} from '@react-navigation/native';

// Memoized components
const MemoizedProductCard = memo(ProductActiveCard);
const MemoizedSecondaryHeader = memo(SecondaryHeader);

const ActiveProducts = () => {
  const {resetProducts} = useProduct();
  const token = useAuthToken();

  const [originalProducts, setOriginalProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);

  // Fetch products with optimized dependency array
  const fetchProducts = useCallback(
    async (isRefresh = false) => {
      try {
        isRefresh ? setIsRefreshing(true) : setIsLoading(true);

        const response = await productService.getAllActiveInactiveProducts(
          token,
        );
        if (response?.status) {
          console.log(JSON.stringify(response.data));
          setProducts(response.data);
          setOriginalProducts(response.data);
        }
      } catch (error) {
        ToastService.show({message: 'Failed to load products', type: 'error'});
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    setTimeout(()=>{
      Alert.alert(
        '*Notice',
        '• This page contains editable settings.\n• Changes are NOT saved automatically.\n• Tap "SAVE CHANGES" after editing.',
        [{text: 'Got it'}],
      );
    },1000);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [fetchProducts]),
  );

  // Refresh handler
  const onRefresh = useCallback(() => {
    fetchProducts(true);
  }, [fetchProducts]);

  // Optimized search with stable reference
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(item => item?.name.toLowerCase().includes(query) || item?.price.toLowerCase().includes(query) || item?.unitType.toLowerCase().includes(query) || item?.description?.toLowerCase().includes(query));
  }, [products, searchQuery]);

  // Stable toggle function
  const toggle = useCallback(id => {
    setProducts(prev =>
      prev.map(item =>
        item.id === id ? {...item, isActive: !item.isActive} : item,
      ),
    );
  }, []);

  // Optimized save function
  const saveProduct = useCallback(async () => {
    try {
      setIsSaveLoading(true);

      // Fast changed detection using Set
      const originalMap = new Map();
      originalProducts.forEach(p => originalMap.set(p.id, p));

      const changed = products.filter(p => {
        const orig = originalMap.get(p.id);
        return orig?.isActive !== p.isActive;
      });

      if (!changed.length) {
        ToastService.show({message: 'No changes to save', type: 'info'});
        return;
      }

      const result = await productService.updateProductStatus(changed);
      if (result?.status) {
        ToastService.show({
          message: 'Changes saved successfully!',
          type: 'success',
        });
        await fetchProducts();
        const allProducts = await productService.getAllProducts(token);
        if (allProducts?.status) resetProducts(allProducts.data);
      }
    } catch (error) {
      ToastService.show({message: 'Failed to save changes', type: 'error'});
    } finally {
      setIsSaveLoading(false);
    }
  }, [products, originalProducts, fetchProducts, resetProducts, token]);

  // Optimized render item with stable reference
  const renderItem = useCallback(
    ({item}) => <MemoizedProductCard item={item} toggle={toggle} />,
    [toggle],
  );

  // Stable key extractor
  const keyExtractor = useCallback(item => item.id.toString(), []);

  // Memoized list empty component
  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>
          {searchQuery
            ? 'No products match your search'
            : 'No products available'}
        </Text>
      </View>
    ),
    [searchQuery],
  );

  // Memoized refresh control
  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        colors={[colors.primary]}
        tintColor={colors.primary}
      />
    ),
    [isRefreshing, onRefresh],
  );

  // Memoized save button content
  const saveButtonContent = useMemo(
    () => (
      <View style={styles.saveBtnContent}>
        {isSaveLoading ? (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={[styles.saveBtnText, {marginLeft: 10}]}>
              Saving...
            </Text>
          </>
        ) : (
          <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
        )}
      </View>
    ),
    [isSaveLoading],
  );

  if (isLoading && !isRefreshing) {
    return (
      <Layout>
        <MemoizedSecondaryHeader
          title="Active products"
          query={searchQuery}
          onchangeText={setSearchQuery}
          isRestart={true}
          handleRestartClick={fetchProducts}
        />
        <View style={styles.fullLoader}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>Loading products...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <MemoizedSecondaryHeader

        title="Active products"
        query={searchQuery}
        onchangeText={setSearchQuery}
        isRestart={true}
        handleRestartClick={fetchProducts}
      />

      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={
          filteredProducts.length === 0 ? styles.emptyContainer : styles.list
        }
        refreshControl={refreshControl}
        ListEmptyComponent={ListEmptyComponent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />

      <TouchableOpacity
        style={[styles.saveBtn, isSaveLoading && styles.saveBtnDisabled]}
        onPress={saveProduct}
        disabled={isSaveLoading || isLoading}>
        {saveButtonContent}
      </TouchableOpacity>
    </Layout>
  );
};

const styles = StyleSheet.create({
  fullLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 16,
    fontSize: font(16),
    color: '#666',
    fontFamily: fonts.inRegular,
  },
  list: {
    paddingHorizontal: padding(16),
    paddingTop: padding(16),
    paddingBottom: padding(100),
    flexGrow: 1,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: padding(20),
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: font(16),
    color: '#999',
    textAlign: 'center',
    fontFamily: fonts.inRegular,
  },
  saveBtn: {
    position: 'absolute',
    bottom: gap(30),
    alignSelf: 'center',
    backgroundColor: '#28A745',
    paddingHorizontal: padding(28),
    paddingVertical: padding(14),
    borderRadius: gap(12),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: font(15),
    fontFamily: fonts.inSemiBold,
    letterSpacing: 0.5,
  },
});

export default memo(ActiveProducts);
