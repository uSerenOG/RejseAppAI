import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {StyleSheet,  Text,  View,  TouchableOpacity,  Platform,  Alert,  ActivityIndicator,  TextInput,  FlatList,  Keyboard,} from 'react-native';
import MapView from './MapView';
import * as Location from 'expo-location';
import axios from 'axios';

const OPENWEATHER_API_KEY = '3f9462ce0aaf015ef651489d3774f4e1';

export default function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

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

        // Henter vejrdata for brugerens position
        fetchWeather(coords.latitude, coords.longitude);
      } catch (e) {
        console.warn(e);
      }
    })();
  }, []);

  // Henter vejr data ud fra OpenWeather API LAN/LON
  const fetchWeather = async (lat, lon) => {
    try {
      setWeatherLoading(true);
      setWeatherError(null);

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
      const res = await axios.get(url);
      setWeather(res.data);
    } catch (err) {
      console.warn(err);
      setWeatherError('Could not load weather data.');
      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Centrer kortet på brugerens lokation
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

  // Kalder OpenWeather geocoding API for søgning
  const searchPlaces = async (query) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError(null);

      // direger forespørgsel til OpenWeather geocoding API
      const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        query
      )}&limit=5&appid=${OPENWEATHER_API_KEY}`;

      const res = await axios.get(url);
      setSearchResults(res.data || []);
    } catch (err) {
      console.warn(err);
      setSearchError('Could not find locations. Try another query.');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // når brugeren vælger et søgeresultat
  const onSelectPlace = (place) => {
    Keyboard.dismiss();
    setSearchQuery('');
    setSearchResults([]);

    const coords = {
      latitude: place.lat,
      longitude: place.lon,
    };

    // animer kort til valgt sted
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...coords,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        500
      );
    }

    // Henter vejrdata for udvalgt sted
    fetchWeather(place.lat, place.lon);
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
            Weather will appear here after selecting a location.
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
    const city = weather.name || 'Location';

    return (
      <View style={styles.weatherBox}>
        <Text style={styles.weatherCity}>{city}</Text>
        <Text style={styles.weatherMain}>
          {temp}°C · {description}
        </Text>
        <Text style={styles.weatherSub}>Feels like {feelsLike}°C</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      

      {/* Map window */}
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={!!hasPermission}
          showsMyLocationButton={false}
        />
      </View>

      {/* Weather panel */}
      {renderWeather()}

      {/* small footer info */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          Search places to see their weather. Tap a result to center the map.
        </Text>
      </View>

{/* Search area */}
      <View style={styles.searchRow}>
        <TextInput
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            // minor throttle: only search when length >= 2
            if (text.length >= 2) {
              searchPlaces(text);
            } else {
              setSearchResults([]);
            }
          }}
          placeholder="Search city, neighbourhood, country..."
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={() => {
            searchPlaces(searchQuery);
            Keyboard.dismiss();
          }}
          clearButtonMode="while-editing"
        />

        <TouchableOpacity style={styles.centerBtnSmall} onPress={centerOnUser}>
          <Text style={styles.centerBtnText}>My loc</Text>
        </TouchableOpacity>
      </View>

      {/* Search results */}
      {searchLoading && (
        <View style={styles.searchFeedback}>
          <ActivityIndicator size="small" />
          <Text style={styles.searchFeedbackText}>Searching...</Text>
        </View>
      )}

      {searchError ? (
        <View style={styles.searchFeedback}>
          <Text style={styles.searchFeedbackText}>{searchError}</Text>
        </View>
      ) : null}

      {searchResults.length > 0 && (
        <View style={styles.resultsBox}>
          <FlatList
            data={searchResults}
            keyExtractor={(item, idx) => `${item.lat}-${item.lon}-${idx}`}
            renderItem={({ item }) => {
              const displayName = `${item.name}${
                item.state ? ', ' + item.state : ''
              }, ${item.country}`;
              return (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => onSelectPlace(item)}
                >
                  <Text style={styles.resultText}>{displayName}</Text>
                  <Text style={styles.resultSub}>
                    {item.lat.toFixed(4)}, {item.lon.toFixed(4)}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

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

  // search bar row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  centerBtnSmall: {
    marginLeft: 8,
    backgroundColor: '#1976D2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  centerBtnText: {
    color: '#fff',
    fontWeight: '600',
  },

  searchFeedback: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchFeedbackText: {
    marginLeft: 8,
  },

  resultsBox: {
    maxHeight: 180,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  resultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultSub: {
    fontSize: 12,
    color: '#666',
  },

  mapWrapper: {
    height: '45%',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 10,
  },
  map: {
    flex: 1,
    width: '100%',
  },

  weatherBox: {
    marginTop: 12,
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
