import React, {useState, useCallback, memo} from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import Octicons from '@react-native-vector-icons/octicons';
import DottedDivider from '../Dividers/DottedDivider';
import {font, icon, padding} from '../../utils/responsive';
import {colors} from '../../utils/colors';
import {fonts} from '../../utils/fonts';

const SelectableItem = memo(({item, isSelected, handleSelectAndDeselect}) => {
  return (
    <TouchableOpacity
      style={styles.selectableCrd}
      onPress={() => handleSelectAndDeselect(item)}>
      <Text style={styles.subNameText}>{item?.name}</Text>

      <View
        style={[
          styles.checkbox,
          isSelected && {backgroundColor: colors.sucess},
        ]}>
        {isSelected && <Octicons name="check" color={'#fff'} size={icon(16)} />}
      </View>
    </TouchableOpacity>
  );
});

const ItemCard = ({
  expandable = false,
  products,
  selectedItems = [],
  setSelectedItem,
}) => {
  const hasItems = products?.products?.length > 0;

  // FORCE collapsed if empty
  const [expanded, setExpanded] = useState(hasItems ? expandable : false);

  const [contentHeight, setContentHeight] = useState(0);
  const [isMeasuring, setIsMeasuring] = useState(true);

  const animatedHeight = useSharedValue(0);
  const animatedOpacity = useSharedValue(0);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    height: withTiming(animatedHeight.value, {duration: 300}),
    overflow: 'hidden',
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(animatedOpacity.value, {duration: 200}),
  }));

  const toggleExpand = useCallback(() => {
    if (isMeasuring) return;

    const newExpanded = !expanded;

    if (newExpanded) {
      animatedHeight.value = withTiming(contentHeight, {duration: 300});
      animatedOpacity.value = withTiming(1, {duration: 200, delay: 100});
    } else {
      animatedOpacity.value = withTiming(0, {duration: 150});
      animatedHeight.value = withTiming(0, {duration: 300, delay: 50});
    }

    setExpanded(newExpanded);
  }, [expanded, contentHeight, isMeasuring]);

  const handleSelectAndDeselect = item => {
    if (selectedItems.some(i => i.id === item.id)) {
      setSelectedItem(prev => prev.filter(i => i.id !== item.id));
    } else {
      setSelectedItem(prev => [...prev, item]);
    }
  };

  const renderItem = useCallback(
    ({item}) => (
      <SelectableItem
        item={item}
        isSelected={selectedItems.some(i => i.id === item.id)}
        handleSelectAndDeselect={handleSelectAndDeselect}
      />
    ),
    [selectedItems, handleSelectAndDeselect],
  );

  const keyExtractor = useCallback((item, index) => index.toString(), []);

  const handleLayout = useCallback(
    event => {
      const height = event.nativeEvent.layout.height;

      if (height > 0 && contentHeight === 0) {
        setContentHeight(height);
        setIsMeasuring(false);

        if (expanded) {
          animatedHeight.value = height;
          animatedOpacity.value = 1;
        }
      }
    },
    [contentHeight, expanded],
  );

  return (
    <View style={styles.card}>
      <Pressable
        style={[styles.cardHeader, !expanded && {backgroundColor: '#fff'}]}
        onPress={toggleExpand}
        disabled={isMeasuring}>
        <Text style={styles.cardHeaderTitle}>{products?.name}</Text>
        <Animated.View
          style={{
            transform: [
              {
                rotate: expanded ? '0deg' : '180deg',
              },
            ],
          }}>
          <MaterialIcons name="arrow-drop-up" size={icon(26)} />
        </Animated.View>
      </Pressable>

      <Animated.View style={containerAnimatedStyle}>
        {isMeasuring && (
          <View
            style={[
              styles.measurementView,

              // Minimum height so empty list can measure itself properly
              !hasItems && {minHeight: 80},
            ]}
            onLayout={handleLayout}>
            {!hasItems ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons
                  name="inventory"
                  size={icon(40)}
                  color={colors.border}
                />
                <Text style={styles.emptyText}>No products available</Text>
              </View>
            ) : (
              <FlatList
                data={products?.products}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                ItemSeparatorComponent={() => (
                  <DottedDivider marginVertical={0} />
                )}
                scrollEnabled={false}
              />
            )}
          </View>
        )}

        {!isMeasuring && (
          <Animated.View style={[styles.contentView, contentAnimatedStyle]}>
            {!hasItems ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons
                  name="inventory"
                  size={icon(40)}
                  color={colors.border}
                />
                <Text style={styles.emptyText}>No products available</Text>
              </View>
            ) : (
              <FlatList
                data={products?.products}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                ItemSeparatorComponent={() => (
                  <DottedDivider marginVertical={0} />
                )}
                scrollEnabled={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
              />
            )}
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 5,
    overflow: 'hidden',
  },
  cardHeader: {
    paddingHorizontal: padding(16),
    paddingVertical: padding(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary + '95',
  },
  cardHeaderTitle: {
    fontSize: font(14),
    fontFamily: fonts.inMedium,
  },
  selectableCrd: {
    padding: padding(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subNameText: {
    fontSize: font(14),
    fontFamily: fonts.inRegular,
    flex: 1,
  },
  checkbox: {
    width: icon(20),
    height: icon(20),
    borderRadius: icon(4),
    backgroundColor: colors.border + '80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  measurementView: {
    position: 'absolute',
    width: '100%',
    opacity: 0,
    pointerEvents: 'none',
  },
  contentView: {
    width: '100%',
  },
  emptyContainer: {
    padding: padding(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: padding(8),
    color: colors.border,
    fontFamily: fonts.inRegular,
    fontSize: font(13),
  },
});

export default memo(ItemCard);
