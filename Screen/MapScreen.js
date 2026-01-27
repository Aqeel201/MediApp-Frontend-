import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import * as Location from 'expo-location';

const MapScreen = () => {
  const [region, setRegion] = React.useState({
    latitude: 35.3247,
    longitude: 75.5510,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  React.useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  const cities = [
    { name: 'Skardu', latitude: 35.3247, longitude: 75.5510 },
    { name: 'Shigar', latitude: 35.4765, longitude: 75.6964 },
  ];

  return (
    <MapView
      style={styles.map}
      region={region}
      showsUserLocation={true}
    >
      {cities.map((city, index) => (
        <Marker
          key={index}
          coordinate={{ latitude: city.latitude, longitude: city.longitude }}
          title={city.name}
        />
      ))}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default MapScreen;
