/**
 * Haversine distance formula – returns distance in kilometres.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Fuzzes a coordinate by up to `radiusKm` km in a random direction.
 * Used to protect exact locations of sensitive problems.
 */
export function fuzzyCoordinate(
  lat: number,
  lon: number,
  radiusKm = 0.5
): { lat: number; lon: number } {
  const r = radiusKm / 111; // ~111 km per degree latitude
  const angle = Math.random() * 2 * Math.PI;
  const dr = Math.random() * r;
  return {
    lat: lat + dr * Math.cos(angle),
    lon: lon + (dr * Math.sin(angle)) / Math.cos((lat * Math.PI) / 180),
  };
}

/**
 * Validates that lat/lon values are in valid geographic ranges.
 */
export function isValidCoordinate(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * Returns a bounding box around a point for pre-filtering DB queries.
 */
export function boundingBox(
  lat: number,
  lon: number,
  radiusKm: number
): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLon: lon - lonDelta,
    maxLon: lon + lonDelta,
  };
}

/**
 * Reverse geocode placeholder — returns a human-readable area string.
 * In production this would call Nominatim / Photon API server-side.
 */
export function coordinatesToAreaString(lat: number, lon: number): string {
  // Rounded to 2 decimal places for privacy
  return `Near ${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
}
