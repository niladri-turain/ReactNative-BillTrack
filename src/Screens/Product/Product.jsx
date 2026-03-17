import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Layout} from '../Layout';
import {
  BottomSheetInput,
  EmptyProductComponent,
  GstSelectModal,
  ProductCard,
  ProductCardRow,
  ProductUnitModal,
  SecondaryHeader,
  ShimmerProductCard,
  SimpleTextInput,
} from '../../Components';
import {
  font,
  gap,
  icon,
  isTabletDevice,
  margin,
  padding,
} from '../../utils/responsive';
import Lucide from '@react-native-vector-icons/lucide';
import {colors} from '../../utils/colors';
import {fonts} from '../../utils/fonts';
import Octicons from '@react-native-vector-icons/octicons';
import ImageCropPicker from 'react-native-image-crop-picker';
import {requestPermission} from '../../utils/helper';
import {
  validateName,
  validatePrice,
  validateProductName,
} from '../../utils/validator';
import ToastService from '../../Components/Toasts/ToastService';
import {productService} from '../../Services/ProductService';
import {useAuthToken, useGstEnabled} from '../../Contexts/AuthContext';
import {API_URL} from '../../utils/config';
import {useProduct} from '../../Contexts/ProductContexts';
import {useRoute} from '@react-navigation/native';

const {width: screenWidth} = Dimensions.get('window');
const NUMBER_OF_COLUMNS = isTabletDevice ? 4 : 3;
const HORIZONTAL_PADDING = 16;
const GAP_BETWEEN_ITEMS = 10;
const ITEM_WIDTH =
  (screenWidth -
    HORIZONTAL_PADDING * 2 -
    GAP_BETWEEN_ITEMS * (NUMBER_OF_COLUMNS - 1)) /
  NUMBER_OF_COLUMNS;
const imageWidth = screenWidth - HORIZONTAL_PADDING * 2;
const imageHeight = imageWidth * 2;

const Product = () => {
  const route = useRoute();
  const doRefreshPage = route.params?.doRefresh || false;
  const {Products, resetProducts, addProduct, removeProduct} = useProduct();
  const isGstEnbaled = useGstEnabled();
  const token = useAuthToken();
  const [showModal, setShowModal] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [isColumn, setIsColumn] = useState(true);
  const [productId, setProductId] = useState(null);
  const [productImage, setProductImage] = useState(null);
  const [productName, setProductName] = useState('');
  const [productUnit, setProductUnit] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [hsnCode, setHsnCode] = useState('');


  const [searchQuery, setSearchQuery] = useState('');

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  // modal states
  const [unitModalVisible, setUnitModalVisible] = useState(false);
  const [hsnModalVisible, setHsnModalVisible] = useState(false);

  const setInitialValueOfModal = () => {
    setProductImage(null);
    setProductName('');
    setProductUnit('');
    setProductPrice('');
    setHsnCode('');
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setInitialValueOfModal();
  };

  const handleEdit = item => {
    setProductId(item.id);
    setProductName(item.name);
    setProductPrice(item.price || '');
    setProductUnit(item.unitType.toUpperCase() || '');
    setProductImage(item.logo);
    setHsnCode(item.hsn);
    handleOpenModal();
    setIsNewProduct(false);
  };

  const renderItem = useCallback(
    ({item, index}) =>
      isColumn ? (
        <ProductCard
          width={ITEM_WIDTH}
          item={{
            id: item.id,
            title: item.name,
            price: item.price,
            image: item?.logo,
          }}
          handleLongPress={() => handleEdit(item)}
          editFunction={() => handleEdit(item)}
        />
      ) : (
        <ProductCardRow
          onpressCard={() => handleEdit(item)}
          item={{
            id: item.id,
            title: item.name,
            price: item.price,
            image: item?.logo,
            unit: item.unitType,
          }}
        />
      ),
    [isColumn],
  );

  const renderLoadingItem = useCallback(
    ({index}) => <ShimmerProductCard width={ITEM_WIDTH} />,
    [],
  );

  const getProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productService.getAllProducts(token);
      if (data?.status) {
        await resetProducts(data?.data || []);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickImag = async () => {
    // const hasPermission = await requestPermission();
    // if (!hasPermission) {
    //   ToastAndroid.show('Permission denied', ToastAndroid.SHORT);
    //   return;
    // }

    ImageCropPicker.openPicker({
      width: 1200,
      height: 900,
      compressImageQuality: 0.8,
      avoidEmptySpaceAroundImage: true,
      cropping: true,
      mediaType: 'photo'
    })
      .then(image => {
        setProductImage(image);
      })
      .catch(err => {
        ToastAndroid.show('Image not selected', ToastAndroid.SHORT);
      });
  };

  const handleSave = async () => {
    const showError = message =>
      ToastService.show({message, type: 'error', position: 'top'});

    if (!productName?.trim() || !validateProductName(productName)) {
      return showError('Please enter a valid name');
    }

    if (!productUnit) {
      return showError('Please select a unit');
    }

    if (!productPrice || !validatePrice(productPrice)) {
      return showError('Please enter a valid price');
    }
    let isImageInserted = false;

    if (productImage && typeof productImage !== 'string') {
      isImageInserted = true;
    }

    if (isNewProduct) {
      try {
        setIsSaveLoading(true);
        const payload = {
          name: productName,
          price: productPrice,
          unit: productUnit,
          token: token,
        };
        if (hsnCode) {
          payload.hsnId = hsnCode?.id;
        }
        if (isImageInserted) {
          payload.productImage = {
            uri: productImage.path,
            type: productImage.mime,
            name: productImage.filename,
          };
        }
        const data = await productService.createProduct({...payload});
        if (data?.status) {
          ToastService.show({
            message: 'Product created successfully',
            type: 'success',
            position: 'top',
          });
          await addProduct(data?.data);
          setTimeout(() => {
            handleCloseModal();
          }, 1);
        } else {
        }
      } catch (error) {
      } finally {
        setIsSaveLoading(false);
      }
      return;
    }

    try {
      setIsSaveLoading(true);
      const data = await productService.updateproduct(token, {
        name: productName,
        id: productId,
        price: productPrice,
        unit: productUnit,
        hsnId: hsnCode?.id,
        productImage: isImageInserted
          ? {
              uri: productImage.path,
              type: productImage.mime,
              name: productImage.filename,
            }
          : null,
      });
      if (data?.status) {
        ToastService.show({
          message: 'Product updated successfully',
          type: 'success',
          position: 'top',
        });
        await addProduct(data?.data);
        setTimeout(() => {
          handleCloseModal();
        }, 1);
      } else {
        ToastService.show({
          message: 'Something went wrong',
          type: 'error',
          position: 'top',
        });
      }
    } catch (error) {
    } finally {
      setIsSaveLoading(false);
    }
  };

  const handleDeleteProduct = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              setIsDeleteLoading(true);
              const data = await productService.deleteProductById(
                token,
                productId,
              );
              if (data?.status) {
                ToastService.show({
                  message: data?.message,
                  type: 'success',
                  position: 'top',
                });
                await removeProduct(productId);
                handleCloseModal();
              } else {
                ToastService.show({
                  message: data?.message,
                  type: 'error',
                  position: 'top',
                });
              }
            } catch (error) {
              ToastAndroid.show('Something went wrong', ToastAndroid.SHORT);
            } finally {
              setIsDeleteLoading(false);
            }
          },
        },
      ],
      {cancelable: false},
    );
  };

  useEffect(() => {
    if (Products.length === 0 || doRefreshPage) {
      getProducts();
    }
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await getProducts();
    setIsRefreshing(false);
  };

  const searchQueryChange = text => {
    setSearchQuery(text);
  };

  const filteredProduct = useMemo(() => {
    if (searchQuery.trim() === '' || !searchQuery) {
      return Products;
    }
    return Products.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [Products, searchQuery]);

  return (
    <Layout>
      <SecondaryHeader
        title={'Product List'}
        isApps={true}
        handleAppClick={() => {
          setIsColumn(prev => !prev);
        }}
        query={searchQuery}
        onchangeText={searchQueryChange}
        isQuestion={false}
        isRestart={true}
        handleRestartClick={onRefresh}
      />
      <FlatList
        key={isColumn ? 'd' : 're'}
        style={{flex: 1}}
        contentContainerStyle={styles.container}
        data={isLoading ? [1, 2, 3, 4, 5, 6] : filteredProduct}
        keyExtractor={(_, index) => index + '_items'}
        renderItem={isLoading ? renderLoadingItem : renderItem}
        numColumns={isColumn ? NUMBER_OF_COLUMNS : 1}
        columnWrapperStyle={isColumn && styles.columnWrapperStyle}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary, colors.sucess, colors.error]}
            tintColor={colors.sucess}
          />
        }
        ListEmptyComponent={() => <EmptyProductComponent />}
      />
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => {
          setIsNewProduct(true);
          handleOpenModal();
        }}>
        <Text style={styles.addBtnText}>Add New Item</Text>
        <Lucide name="plus" size={10} color={'#fff'} />
      </TouchableOpacity>
      <Modal
        visible={showModal}
        animationType="slide"
        backdropColor={'#00000005'}
        onRequestClose={handleCloseModal}>
        <Pressable onPress={handleCloseModal} style={styles.modelContainer}>
          <Pressable onPress={() => {}} style={styles.modelSubContainer}>
            <View style={styles.imageCOntainer}>
              <Image
                style={styles.image}
                source={
                  productImage
                    ? typeof productImage === 'string'
                      ? {uri: `${API_URL}files/product/${productImage}`}
                      : {uri: productImage?.path}
                    : require('./../../../asset/images/emptyimg.jpg')
                }
                resizeMode="cover"
              />
              <View style={styles.uploadBtnContainer}>
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={handlePickImag}>
                  <Octicons name="upload" size={icon(14)} color={'#fff'} />
                  <Text style={styles.uploadBtnText}>Upload image</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.inputContainer}>
              <View style={styles.inputSubContainer}>
                <Text style={styles.labelText}>Product Name</Text>
                <SimpleTextInput
                  placeholder={''}
                  value={productName}
                  setValue={setProductName}
                  hasError={productName && !validateProductName(productName)}
                  multiline={true}
                />
              </View>
              <View style={[styles.inputDoubleContianer]}>
                <View style={[styles.inputSubContainer, {width: '45%'}]}>
                  <Text style={styles.labelText}>Unit</Text>
                  <BottomSheetInput
                    label={productUnit}
                    onPress={() => {
                      setUnitModalVisible(true);
                    }}
                  />
                </View>
                <View style={[styles.inputSubContainer, {width: '45%'}]}>
                  <Text style={styles.labelText}>
                    Price{isGstEnbaled ? '(Including GST)' : '(Selling Price)'}
                  </Text>
                  <SimpleTextInput
                    placeholder={''}
                    value={productPrice}
                    setValue={setProductPrice}
                    keyboardType="numeric"
                    hasError={productPrice && !validatePrice(productPrice)}
                  />
                </View>
              </View>
              {isGstEnbaled && (
                <View style={styles.inputSubContainer}>
                  <Text style={styles.labelText}>HSN Code</Text>
                  <BottomSheetInput
                    label={
                      hsnCode
                        ? `${hsnCode.hsnCode} CGST ${hsnCode.cGst}% SGST ${hsnCode.sGst}% IGST ${hsnCode.iGst}%`
                        : 'Select HSN'
                    }
                    onPress={() => {
                      setHsnModalVisible(true);
                    }}
                  />
                </View>
              )}
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.saveBtn, {backgroundColor: colors.error}]}
                disabled={isDeleteLoading || isNewProduct}
                onPress={handleDeleteProduct}>
                {isDeleteLoading ? (
                  <ActivityIndicator color={'#fff'} size={'small'} />
                ) : (
                  <Text style={styles.saveBtnText}>Delete</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={isSaveLoading}>
                {isSaveLoading ? (
                  <ActivityIndicator color={'#fff'} size={'small'} />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {isNewProduct ? 'ADD' : 'UPDATE'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <ProductUnitModal
        visible={unitModalVisible}
        value={productUnit}
        setValue={setProductUnit}
        handleCancel={() => setUnitModalVisible(false)}
      />
      <GstSelectModal
        visible={hsnModalVisible}
        handleCancel={() => setHsnModalVisible(false)}
        value={hsnCode}
        setValue={setHsnCode}
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: padding(16),
    marginTop: margin(16),
    paddingBottom: padding(80),
  },
  columnWrapperStyle: {
    gap: GAP_BETWEEN_ITEMS,
    paddingBottom: padding(16),
  },
  addBtn: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: colors.sucess,
    paddingHorizontal: padding(20),
    paddingVertical: padding(12),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 1000,
    gap: gap(8),
  },
  addBtnText: {
    fontSize: font(12),
    fontFamily: fonts.inMedium,
    color: '#fff',
  },
  modelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    // backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modelSubContainer: {
    backgroundColor: '#fff',
    marginHorizontal: margin(16),
    padding: padding(16),
    borderRadius: 5,
    width: screenWidth - HORIZONTAL_PADDING * 2,
  },
  imageCOntainer: {
    width: isTabletDevice ? '40%' : '100%',
    aspectRatio: 16 / 9,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  uploadBtnContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap(5),
    paddingHorizontal: padding(isTabletDevice ? 18 : 24),
    paddingVertical: padding(isTabletDevice ? 8 : 10),
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  uploadBtnText: {
    fontSize: font(isTabletDevice ? 12 : 14),
    fontFamily: fonts.inBold,
    color: '#fff',
  },
  inputContainer: {
    marginVertical: 16,
  },
  inputSubContainer: {
    gap: gap(8),
  },
  inputDoubleContianer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: margin(10),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap(16),
    marginBottom: 10,
  },
  saveBtn: {
    paddingVertical: padding(8),
    paddingHorizontal: margin(20),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.sucess,
    borderRadius: 5,
  },
  saveBtnText: {
    fontSize: font(14),
    fontFamily: fonts.onSemiBold,
    color: '#fff',
  },
  labelText: {
    fontSize: font(12),
    fontFamily: fonts.onMedium,
    color: '#000',
  },
});

export default Product;
