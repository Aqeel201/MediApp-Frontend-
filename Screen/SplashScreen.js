
// import React, { useEffect } from 'react';
// import { View, Image, StyleSheet } from 'react-native';
// import { useNavigation } from '@react-navigation/native';

// const SplashScreen = () => {
//   const navigation = useNavigation();

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       navigation.navigate('Login');
//     }, 3000); // 3 seconds delay

//     return () => clearTimeout(timer); // Cleanup the timer
//   }, [navigation]);

//   return (
//     <View style={styles.container}>
//       <Image source={require('../assets/Logo.png')} style={styles.logo} />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f0f4ff', // Background color
//   },
//   logo: {
//     width: 200, // Adjust size as needed
//     height: 200, // Adjust size as needed
//     resizeMode: 'contain',
//   },
// });

// export default SplashScreen;
