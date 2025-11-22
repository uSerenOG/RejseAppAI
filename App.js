import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Platform, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [markers, setMarkers] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setHasPermission(status === 'granted');
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Location permission is required to show your current position.');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        // center the map once we have location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      } catch (e) {
        console.warn(e);
      }
    })();
  }, []);

  const onMapPress = (e) => {
    const coord = e.nativeEvent.coordinate;
    const newMarker = {
      id: Date.now().toString(),
      coordinate: coord,
    };
    setMarkers((m) => [...m, newMarker]);
  };

  const onMarkerDragEnd = (e, id) => {
    const coord = e.nativeEvent.coordinate;
    setMarkers((prev) => prev.map((mk) => (mk.id === id ? { ...mk, coordinate: coord } : mk)));
  };

  const centerOnUser = async () => {
    if (!hasPermission) {
      Alert.alert('No permission', 'Location permission not granted');
      return;
    }
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const region = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      if (mapRef.current) mapRef.current.animateToRegion(region, 500);
    } catch (e) {
      console.warn(e);
    }
  };

  const initialRegion = userLocation
    ? { ...userLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : { latitude: 55.6761, longitude: 12.5683, latitudeDelta: 0.2, longitudeDelta: 0.2 };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onPress={onMapPress}
        showsUserLocation={!!hasPermission}
        showsMyLocationButton={false}
      >
        {markers.map((m) => (
          <Marker
            key={m.id}
            coordinate={m.coordinate}
            draggable
            onDragEnd={(e) => onMarkerDragEnd(e, m.id)}
          />
        ))}
      </MapView>

      <View style={styles.topRight}>
        <TouchableOpacity style={styles.button} onPress={centerOnUser}>
          <Text style={styles.buttonText}>Center</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>Tap the map to add a marker. Drag markers to move them.</Text>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  topRight: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 12,
  },
  button: {
    backgroundColor: '#1976D2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  instructions: {
    position: 'absolute',
    bottom: 20,
    left: 12,
    right: 12,
    alignItems: 'center',
  },
  instructionsText: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 6,
    fontSize: 13,
  },
});
