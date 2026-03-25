/**
 * Geospatial Utilities
 * Helper functions for location-based operations
 */

/**
 * Calculate distance between two coordinates in kilometers
 * Using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Validate latitude coordinate
 */
function isValidLatitude(lat) {
  return lat && typeof lat === 'number' && lat >= -90 && lat <= 90;
}

/**
 * Validate longitude coordinate
 */
function isValidLongitude(lon) {
  return lon && typeof lon === 'number' && lon >= -180 && lon <= 180;
}

/**
 * Validate coordinates
 */
function isValidCoordinates(lat, lon) {
  return isValidLatitude(lat) && isValidLongitude(lon);
}

/**
 * Get bounds for a radius search
 * Returns min/max lat/lon for pre-filtering
 */
function getSearchBounds(lat, lon, radiusKm) {
  const latChange = radiusKm / 111; // 1 degree latitude ≈ 111 km
  const lonChange = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  return {
    minLat: lat - latChange,
    maxLat: lat + latChange,
    minLon: lon - lonChange,
    maxLon: lon + lonChange,
  };
}

module.exports = {
  calculateDistance,
  isValidLatitude,
  isValidLongitude,
  isValidCoordinates,
  getSearchBounds,
};
