import { Dimensions, PixelRatio, Platform } from 'react-native';

// Define base dimensions (these are from a standard device, like iPhone 8, which has a width of 375 and height of 667)
const baseWidth = 375;
const baseHeight = 667;

const getWindow = () => {
  const win = Dimensions.get('window');
  if (win && typeof win.width === 'number' && win.width > 0) {
    return win;
  }
  return { width: baseWidth, height: baseHeight };
};

/**
 * Function to scale based on width of the screen
 */
const scale = (size) => {
  const { width } = getWindow();
  return (width / baseWidth) * size;
};

/**
 * Function to scale based on height of the screen
 */
const verticalScale = (size) => {
  const { height } = getWindow();
  return (height / baseHeight) * size;
};

/**
 * Function to normalize font sizes based on Pixel Ratio and device dimensions
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
 */
export const responsive = {
  get width() { return getWindow().width; },
  get height() { return getWindow().height; },
  scale,
  verticalScale,
  normalizeFontSize,
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
};

// Event Listener for handling orientation changes or screen size changes
Dimensions.addEventListener('change', () => {
  // No need to manually reassign as we added getters
});
