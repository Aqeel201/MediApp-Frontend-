// responsive.js
import { Dimensions, PixelRatio } from 'react-native';

const getWindow = () => {
  const win = Dimensions.get('window');
  if (win && typeof win.width === 'number' && win.width > 0) {
    return win;
  }
  return { width: 375, height: 667 };
};

// Get width percentage
export const wp = (percentage) => {
  const { width } = getWindow();
  const value = (percentage * width) / 100;
  return Math.round(value);
};

// Get height percentage
export const hp = (percentage) => {
  const { height } = getWindow();
  const value = (percentage * height) / 100;
  return Math.round(value);
};

// Scaled font size
export const fontSize = (size) => {
  const { width } = getWindow();
  const scale = width / 375; // 375 is base screen width (iPhone 11)
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};
