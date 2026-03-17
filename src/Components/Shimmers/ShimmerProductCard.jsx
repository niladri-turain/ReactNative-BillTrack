import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import ShimmerLine from './ShimmerLine';
import { heightResponsive, widthResponsive } from '../../utils/responsive';

const ShimmerProductCard = ({ width = widthResponsive(113) }) => {
  const PADDING = widthResponsive(8);

  const {
    imageHeight,
    titleHeight,
    priceHeight,
    buttonSize,
    bottomMarginTop,
  } = useMemo(() => {
    const imageWidth = width - PADDING * 2;

    return {
      imageHeight: (imageWidth * 3) / 4,
      titleHeight: heightResponsive(14),
      priceHeight: heightResponsive(16),
      buttonSize: widthResponsive(24),
      bottomMarginTop: widthResponsive(20),
    };
  }, [width]);

  return (
    <View style={[styles.container, { width }]}>
      {/* Image shimmer */}
      <ShimmerLine height={imageHeight} radius={widthResponsive(8)} />

      {/* Title shimmer */}
      <View style={{ marginTop: heightResponsive(6) }}>
        <ShimmerLine width="80%" height={titleHeight} radius={4} />
      </View>

      {/* Bottom Section */}
      <View style={[styles.bottomContainer, { marginTop: bottomMarginTop }]}>
        {/* Price shimmer */}
        <ShimmerLine width="35%" height={priceHeight} radius={4} />

        {/* Edit button shimmer */}
        <ShimmerLine
          width={buttonSize}
          height={buttonSize}
          radius={buttonSize * 0.15}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default React.memo(ShimmerProductCard);
