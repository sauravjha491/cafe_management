"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom icons
const customerIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1216/1216844.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const cafeIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/619/619153.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const riderIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

interface DeliveryTrackerMapProps {
  customerLocation: { lat: number, lng: number };
  cafeLocation: { lat: number, lng: number };
  riderLocation?: { lat: number, lng: number } | null;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

export default function DeliveryTrackerMap({ customerLocation, cafeLocation, riderLocation }: DeliveryTrackerMapProps) {
  const [center, setCenter] = useState<[number, number]>([cafeLocation.lat, cafeLocation.lng]);

  useEffect(() => {
    if (riderLocation) {
      setCenter([riderLocation.lat, riderLocation.lng]);
    } else {
      setCenter([customerLocation.lat, customerLocation.lng]);
    }
  }, [riderLocation, customerLocation]);

  return (
    <MapContainer 
      center={center} 
      zoom={14} 
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <ChangeView center={center} />

      <Marker position={[cafeLocation.lat, cafeLocation.lng]} icon={cafeIcon}>
        <Popup>Cafe Location</Popup>
      </Marker>

      <Marker position={[customerLocation.lat, customerLocation.lng]} icon={customerIcon}>
        <Popup>Your Location</Popup>
      </Marker>

      {riderLocation && (
        <Marker position={[riderLocation.lat, riderLocation.lng]} icon={riderIcon}>
          <Popup>Rider is here</Popup>
        </Marker>
      )}

      {/* Show route line between cafe and customer or rider and customer */}
      <Polyline 
        positions={[
          [cafeLocation.lat, cafeLocation.lng],
          [customerLocation.lat, customerLocation.lng]
        ]}
        color="red"
        dashArray="10, 10"
        weight={2}
        opacity={0.5}
      />
    </MapContainer>
  );
}
