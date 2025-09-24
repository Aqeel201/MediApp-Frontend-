import { StyleSheet } from 'react-native';
import { wp, hp, fontSize } from './responsive';

const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    backgroundColor: '#f9f9f9',
  },
  titleText: {
    fontSize: fontSize(20),
    fontWeight: 'bold',
    marginBottom: hp(2),
    color: '#1e293b',
  },
  subtitleText: {
    fontSize: fontSize(16),
    color: '#64748b',
    marginBottom: hp(1),
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderRadius: wp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: fontSize(16),
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: wp(2),
    padding: wp(3),
    fontSize: fontSize(16),
    backgroundColor: '#fff',
    marginBottom: hp(1.5),
  },
  card: {
    backgroundColor: '#fff',
    padding: wp(4),
    borderRadius: wp(2),
    marginBottom: hp(1.5),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: fontSize(18),
    fontWeight: '600',
    marginBottom: hp(0.5),
  },
  cardSubtitle: {
    fontSize: fontSize(14),
    color: '#6b7280',
  },
});

export default globalStyles;
