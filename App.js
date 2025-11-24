import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView from './MapView';
import * as Location from 'expo-location';
import axios from 'axios';

const OPENWEATHER_API_KEY = '3f9462ce0aaf015ef651489d3774f4e1'; // <- put your key here

export default function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setHasPermission(status === 'granted');
        if (status !== 'granted') {
          Alert.alert(
            'Permission needed',
            'Location permission is required to show your current position.'
          );
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });

        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };

        setUserLocation(coords);

        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...coords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }

        // fetch weather for current location
        fetchWeather(coords.latitude, coords.longitude);
      } catch (e) {
        console.warn(e);
      }
    })();
  }, []);

  const fetchWeather = async (lat, lon) => {
    try {
      setWeatherLoading(true);
      setWeatherError(null);

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;

      const response = await axios.get(url);

      setWeather(response.data);
    } catch (error) {
      console.warn(error);
      setWeatherError('Could not load weather data.');
      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  };

  const centerOnUser = async () => {
    if (!hasPermission) {
      Alert.alert('No permission', 'Location permission not granted');
      return;
    }
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      const region = {
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      if (mapRef.current) mapRef.current.animateToRegion(region, 500);

      setUserLocation(coords);
      fetchWeather(coords.latitude, coords.longitude);
    } catch (e) {
      console.warn(e);
    }
  };

  const initialRegion = userLocation
    ? { ...userLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : {
        latitude: 55.6761,
        longitude: 12.5683,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      };

  const renderWeather = () => {
    if (weatherLoading) {
      return (
        <View style={styles.weatherBox}>
          <ActivityIndicator size="small" />
          <Text style={styles.weatherText}>Loading weather...</Text>
        </View>
      );
    }

    if (weatherError) {
      return (
        <View style={styles.weatherBox}>
          <Text style={styles.weatherText}>{weatherError}</Text>
        </View>
      );
    }

    if (!weather) {
      return (
        <View style={styles.weatherBox}>
          <Text style={styles.weatherText}>
            Weather will appear here once location is available.
          </Text>
        </View>
      );
    }

    const temp = Math.round(weather.main.temp);
    const feelsLike = Math.round(weather.main.feels_like);
    const description =
      weather.weather && weather.weather[0]
        ? weather.weather[0].description
        : 'N/A';
    const city = weather.name || 'Current location';

    return (
      <View style={styles.weatherBox}>
        <Text style={styles.weatherCity}>{city}</Text>
        <Text style={styles.weatherMain}>{temp}°C · {description}</Text>
        <Text style={styles.weatherSub}>Feels like {feelsLike}°C</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={!!hasPermission}
          showsMyLocationButton={false}
        />
        <View style={styles.topRight}>
          <TouchableOpacity style={styles.button} onPress={centerOnUser}>
            <Text style={styles.buttonText}>Center</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Weather panel */}
      {renderWeather()}

      {/* Info text */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          The map shows your location. Weather data is loaded from OpenWeather.
        </Text>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
  },
  mapWrapper: {
    height: '50%',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  topRight: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 16 : 10,
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
  weatherBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  weatherCity: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  weatherMain: {
    fontSize: 14,
    marginBottom: 2,
  },
  weatherSub: {
    fontSize: 12,
    color: '#555',
  },
  weatherText: {
    fontSize: 13,
  },
  instructions: {
    marginTop: 12,
    alignItems: 'center',
  },
  instructionsText: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 6,
    fontSize: 13,
    textAlign: 'center',
  },
});
