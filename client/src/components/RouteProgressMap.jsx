import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, Marker, Polyline, DirectionsService } from '@react-google-maps/api';

// Container fills parent; ensure parent has fixed height (e.g., h-96)
const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '16px',
  overflow: 'hidden'
};

// Colors/styles
const COLORS = {
  remaining: '#1E88E5', // blue
  completed: '#9E9E9E', // gray
  pickup: '#43A047', // green
  destination: '#E53935' // red
};

const remainingPolylineOptions = {
  strokeColor: COLORS.remaining,
  strokeOpacity: 0.9,
  strokeWeight: 6
};

const completedPolylineOptions = {
  strokeColor: COLORS.completed,
  strokeOpacity: 0.8,
  strokeWeight: 6
};

// Haversine distance (meters)
function haversine(a, b) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

function toLatLngLiteralArray(overviewPath) {
  if (!overviewPath) return [];
  return overviewPath.map((p) => ({ lat: p.lat ? p.lat() : p.lat, lng: p.lng ? p.lng() : p.lng }));
}

function closestPointIndexOnPath(point, path) {
  if (!path || path.length === 0) return 0;
  let minIdx = 0;
  let minDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < path.length; i++) {
    const d = haversine(point, path[i]);
    if (d < minDist) {
      minDist = d;
      minIdx = i;
    }
  }
  return minIdx;
}

function cumulativeDistances(path) {
  const cum = [0];
  for (let i = 1; i < path.length; i++) {
    cum[i] = cum[i - 1] + haversine(path[i - 1], path[i]);
  }
  return cum;
}

/**
 * RouteProgressMap
 * Props:
 * - phase: 'to_pickup' | 'to_destination'
 * - captainPos: {lat, lng}
 * - pickup: {lat, lng} | string (address)
 * - destination: {lat, lng} | string (address)
 * - zoom?: number (default 15)
 * - onProgress?: (metersRemaining: number) => void
 * - showMarkers?: boolean (default true)
 * - fitBounds?: boolean (default true)
 */
export default function RouteProgressMap({
  phase = 'to_pickup',
  captainPos,
  pickup,
  destination,
  zoom = 15,
  onProgress,
  showMarkers = true,
  fitBounds = true
}) {
  const mapRef = useRef(null);
  const [internalPos, setInternalPos] = useState(null);
  const [directionsRequest, setDirectionsRequest] = useState(null);
  const [routePath, setRoutePath] = useState([]); // full path as LatLngLiteral[]
  const [closestIdx, setClosestIdx] = useState(0);

  // Fallback to browser geolocation if captainPos is not supplied
  useEffect(() => {
    if (captainPos) return; // External position provided
    if (!navigator.geolocation) return;
    let watchId;
    navigator.geolocation.getCurrentPosition((pos) => {
      setInternalPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
    watchId = navigator.geolocation.watchPosition((pos) => {
      setInternalPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [captainPos]);

  // Determine origin/destination for the current phase
  const effectiveCaptainPos = captainPos || internalPos;
  const { origin, dest } = useMemo(() => {
    if (phase === 'to_pickup') {
      return { origin: effectiveCaptainPos, dest: pickup };
    }
    // to_destination
    return { origin: effectiveCaptainPos, dest: destination };
  }, [phase, effectiveCaptainPos, pickup, destination]);

  // Build a new directions request when origin/dest change
  useEffect(() => {
    if (!origin || !dest) return;
    setDirectionsRequest({
      origin,
      destination: dest,
      travelMode: window.google?.maps?.TravelMode?.DRIVING || 'DRIVING'
    });
  }, [origin, dest]);

  // Update closest index when captain moves
  useEffect(() => {
    if (!effectiveCaptainPos || routePath.length < 2) return;
    const idx = closestPointIndexOnPath(effectiveCaptainPos, routePath);
    setClosestIdx(idx);

    if (onProgress) {
      // compute remaining distance along the polyline from idx to end
      const cum = cumulativeDistances(routePath);
      const remaining = cum[cum.length - 1] - cum[Math.max(0, idx)];
      onProgress(Math.max(0, remaining));
    }
  }, [effectiveCaptainPos, routePath, onProgress]);

  // Fit bounds to full route initially
  useEffect(() => {
    if (!fitBounds || !mapRef.current || routePath.length < 2) return;
    const bounds = new window.google.maps.LatLngBounds();
    routePath.forEach((p) => bounds.extend(p));
    mapRef.current.fitBounds(bounds, 64);
  }, [fitBounds, routePath]);

  const onLoad = (map) => {
    mapRef.current = map;
  };

  const handleDirections = (res, status) => {
    if (status !== 'OK' || !res?.routes?.length) return;
    const overview = res.routes[0].overview_path || [];
    const path = toLatLngLiteralArray(overview);
    setRoutePath(path);
  };

  const remainingPath = useMemo(() => {
    if (!routePath.length) return [];
    return routePath.slice(Math.max(0, closestIdx));
  }, [routePath, closestIdx]);

  const completedPath = useMemo(() => {
    if (!routePath.length) return [];
    return routePath.slice(0, Math.max(0, closestIdx + 1));
  }, [routePath, closestIdx]);

  const center = effectiveCaptainPos || (routePath[0] || { lat: 0, lng: 0 });

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden">
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={zoom} onLoad={onLoad}>
        {directionsRequest && (
          <DirectionsService options={directionsRequest} callback={handleDirections} />
        )}

        {/* Captain marker */}
        {effectiveCaptainPos && (
          <Marker position={effectiveCaptainPos} icon={{
            path: window.google?.maps?.SymbolPath?.FORWARD_CLOSED_ARROW || 0,
            scale: 5,
            fillColor: '#000',
            fillOpacity: 1,
            strokeWeight: 1
          }} />
        )}

        {/* Pickup and destination markers */}
        {showMarkers && typeof pickup !== 'string' && pickup && (
          <Marker position={pickup} label={{ text: 'P', color: '#fff' }} icon={{
            path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
            scale: 8,
            fillColor: COLORS.pickup,
            fillOpacity: 1,
            strokeColor: COLORS.pickup,
            strokeWeight: 2
          }} />
        )}
        {showMarkers && typeof destination !== 'string' && destination && (
          <Marker position={destination} label={{ text: 'D', color: '#fff' }} icon={{
            path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
            scale: 8,
            fillColor: COLORS.destination,
            fillOpacity: 1,
            strokeColor: COLORS.destination,
            strokeWeight: 2
          }} />
        )}

        {/* Completed and remaining polylines */}
        {completedPath.length >= 2 && (
          <Polyline path={completedPath} options={completedPolylineOptions} />
        )}
        {remainingPath.length >= 2 && (
          <Polyline path={remainingPath} options={remainingPolylineOptions} />
        )}
      </GoogleMap>
    </div>
  );
}
