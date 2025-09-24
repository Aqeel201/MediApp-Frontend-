import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get device's screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Define base dimensions (these are from a standard device, like iPhone 8, which has a width of 375 and height of 667)
const baseWidth = 375;
const baseHeight = 667;

/**
 * Function to scale based on width of the screen
 * @param {number} size - The size you want to scale
 */
const scale = (size) => (screenWidth / baseWidth) * size;

/**
 * Function to scale based on height of the screen
 * @param {number} size - The size you want to scale vertically
 */
const verticalScale = (size) => (screenHeight / baseHeight) * size;

/**
 * Function to normalize font sizes based on Pixel Ratio and device dimensions
 * @param {number} size - The size of the font you want to normalize
 */
const normalizeFontSize = (size) => {
  const newSize = scale(size);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

/**
 * Responsive utility to be used globally in the app.
 * This object contains scaling methods and other platform-based checks.
 */
export const responsive = {
  width: screenWidth,
  height: screenHeight,
  scale,
  verticalScale,
  normalizeFontSize,
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
};

// Event Listener for handling orientation changes or screen size changes
Dimensions.addEventListener('change', ({ window: { width, height } }) => {
  // Reassign width and height on orientation change
  responsive.width = width;
  responsive.height = height;
});
