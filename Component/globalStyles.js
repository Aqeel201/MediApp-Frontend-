import { StyleSheet } from 'react-native';
import { responsive } from './responsive';

export const globalStyles = StyleSheet.create({
  // General container style
  container: {
    flex: 1,
    padding: responsive.scale(16), // Responsive padding
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Text styles
  text: {
    fontSize: responsive.normalizeFontSize(18), // Responsive font size
    color: '#333',
  },
  // Header text (larger)
  headerText: {
    fontSize: responsive.normalizeFontSize(24), // Larger font size for headers
    fontWeight: 'bold',
    color: '#000',
  },
  // Button styles
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: responsive.verticalScale(12), // Responsive vertical padding
    paddingHorizontal: responsive.scale(24), // Responsive horizontal padding
    borderRadius: responsive.scale(5), // Responsive border radius
    alignItems: 'center',
  },
  // Button text
  buttonText: {
    fontSize: responsive.normalizeFontSize(14), // Responsive font size for button text
    color: '#fff',
    fontWeight: '600',
  },
  // Input styles
  input: {
    width: '100%',
    padding: responsive.verticalScale(10), // Responsive padding for input
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: responsive.scale(5), // Responsive border radius
    marginBottom: responsive.verticalScale(12), // Responsive margin bottom
    fontSize: responsive.normalizeFontSize(16),
  },
  // Card styles (can be used for components like product cards or lists)
  card: {
    backgroundColor: '#fff',
    padding: responsive.scale(16),
    borderRadius: responsive.scale(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: responsive.verticalScale(16), // Responsive margin for spacing
  },
  // Card title
  cardTitle: {
    fontSize: responsive.normalizeFontSize(20),
    fontWeight: '600',
    marginBottom: responsive.verticalScale(8),
    color: '#333',
  },
  // Card description text
  cardDescription: {
    fontSize: responsive.normalizeFontSize(16),
    color: '#666',
  },
  // Safe area for the top (iOS devices)
  safeArea: {
    flex: 1,
    paddingTop: responsive.verticalScale(20), // Padding top for status bar (iOS)
  },
  // For form inputs or buttons with horizontal layout
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: responsive.verticalScale(12),
  },
});

