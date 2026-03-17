// // utils/responsive.js
// import {Dimensions} from 'react-native';

// const {width, height} = Dimensions.get('window');
// const BASE_WIDTH = 402;
// const BASE_HEIGHT = 874;
// const SCALE = width / BASE_WIDTH;
// const SCALE_HEIGHT = height / BASE_HEIGHT;

// export const font = size => size * SCALE;
// export const padding = size => size * SCALE;
// export const margin = size => size * SCALE;
// export const icon = size => size * SCALE;
// export const gap = size => size * SCALE;
// export const scale = SCALE;

// // New width and height responsive functions
// export const widthResponsive = size => size * SCALE;
// export const heightResponsive = size => size * SCALE_HEIGHT;
// export const scaleHeight = SCALE_HEIGHT;
// export const height70 = heightResponsive(BASE_HEIGHT * 0.7);

// export const ScreenWidth = width

// utils/responsive.js
import {Dimensions} from 'react-native';

const {width, height} = Dimensions.get('window');
const BASE_WIDTH = 402;
const BASE_HEIGHT = 874;

// Tablet detection (common threshold)
const isTablet = Math.min(width, height) >= 600;

// Scale factors
const SCALE = isTablet ? 1.1 : width / BASE_WIDTH; // if tab so change 1 to 1.something ok 
const SCALE_HEIGHT = isTablet ? 1 : height / BASE_HEIGHT;

export const font = size => size * SCALE;
export const padding = size => size * SCALE;
export const margin = size => size * SCALE;
export const icon = size => size * SCALE;
export const gap = size => size * SCALE;
export const scale = SCALE;

// Width/height responsive functions
export const widthResponsive = size => size * SCALE;
export const heightResponsive = size => size * SCALE_HEIGHT;
export const scaleHeight = SCALE_HEIGHT;
export const height70 = heightResponsive(BASE_HEIGHT * 0.7);

// Screen dimensions (not scaled)
export const ScreenWidth = width;
export const ScreenHeight = height;

// for chart bar height
export const HOME_CHART_HEIGHT = 210;

// Export flag in case you need it
export const isTabletDevice = isTablet;
