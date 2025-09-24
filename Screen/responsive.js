// responsive.js
import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

// Get width percentage
export const wp = (percentage) => {
  const value = (percentage * width) / 100;
  return Math.round(value);
};

// Get height percentage
export const hp = (percentage) => {
  const value = (percentage * height) / 100;
  return Math.round(value);
};

// Scaled font size
export const fontSize = (size) => {
  const scale = width / 375; // 375 is base screen width (iPhone 11)
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};
