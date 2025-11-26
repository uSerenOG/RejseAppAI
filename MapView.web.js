// MapView.web.js
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react';
import { View, StyleSheet } from 'react-native';
import {
  MapContainer,
  TileLayer,
  Marker as LeafletMarker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Gør at kortet kan håndtere klik ligesom i react-native-maps
function ClickHandler({ onPress }) {
  useMapEvents({
    click(e) {
      if (onPress) {
        onPress({
          nativeEvent: {
            coordinate: {
              latitude: e.latlng.lat,
              longitude: e.latlng.lng,
            },
          },
        });
      }
    },
  });
  return null;
}

// Web version af MapView
const WebMapView = forwardRef(function WebMapView(
  { style, initialRegion, onPress, children },
  ref
) {
  const mapRef = useRef(null);

  // Gør animateToRegion tilgængelig, så eksisterende centerOnUser() fungerer
  useImperativeHandle(ref, () => ({
    animateToRegion(region) {
      if (!mapRef.current || !region) return;
      const { latitude, longitude } = region;
      mapRef.current.setView(
        [latitude, longitude],
        mapRef.current.getZoom(),
        { animate: true }
      );
    },
  }));

  const center = initialRegion
    ? [initialRegion.latitude, initialRegion.longitude]
    : [0, 0];

  const zoom = initialRegion
    ? Math.max(3, 16 - initialRegion.latitudeDelta * 50)
    : 3;

  return (
    <View style={[styles.container, style]}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={styles.map}
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <ClickHandler onPress={onPress} />
        {children}
      </MapContainer>
    </View>
  );
});

// Web version af Marker der prøver at efterligne react-native-maps Marker
function Marker({ coordinate, draggable, onDragEnd }) {
  const map = useMap(); 

  const eventHandlers =
    draggable && onDragEnd
      ? {
          dragend(e) {
            const { lat, lng } = e.target.getLatLng();
            onDragEnd({
              nativeEvent: {
                coordinate: {
                  latitude: lat,
                  longitude: lng,
                },
              },
            });
          },
        }
      : undefined;

  return (
    <LeafletMarker
      position={[coordinate.latitude, coordinate.longitude]}
      draggable={!!draggable}
      eventHandlers={eventHandlers}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default WebMapView;
export { Marker };
