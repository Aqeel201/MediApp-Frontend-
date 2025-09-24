import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const MapScreen = () => {
  const cities = [
    { name: 'Skardu', latitude: 35.3247, longitude: 75.5510 },
    { name: 'Shigar', latitude: 35.4765, longitude:75.6964 },
  ];

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: 30.3753,
        longitude: 69.3451,
        latitudeDelta: 15,
        longitudeDelta: 15,
      }}
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
