/**
 * Lok Samadhan - OpenStreetMap Geo Spatial Utilities
 * Haversine formula, cluster detection, and distance calculations
 */

/**
 * Calculates the great-circle distance between two points on Earth using Haversine formula
 * @param {number} lat1 Latitude of point 1 in degrees
 * @param {number} lon1 Longitude of point 1 in degrees
 * @param {number} lat2 Latitude of point 2 in degrees
 * @param {number} lon2 Longitude of point 2 in degrees
 * @returns {number} Distance in kilometers
 */
function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const toRad = (degree) => (degree * Math.PI) / 180;
  const R = 6371; // Earth's mean radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats distance into a human-friendly string (e.g., '350 m' or '2.4 km')
 */
function formatDistance(distKm) {
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m`;
  }
  return `${distKm.toFixed(1)} km`;
}

/**
 * Filters a list of items having lat and lng within a radius from center point
 */
function filterWithinRadius(items, centerLat, centerLng, radiusKm = 5) {
  return items
    .map((item) => {
      const lat = item.latitude !== undefined ? item.latitude : item.lat;
      const lng = item.longitude !== undefined ? item.longitude : item.lng;
      if (lat === undefined || lng === undefined) return null;

      const dist = calculateHaversineDistanceKm(centerLat, centerLng, lat, lng);
      return {
        ...item,
        distanceKm: Number(dist.toFixed(2)),
        distanceFormatted: formatDistance(dist)
      };
    })
    .filter((item) => item !== null && item.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Detects geographic hotspots/clusters of grievances
 * Useful for civic departments to identify recurring infrastructural failures
 */
function clusterGrievances(grievances, clusterRadiusKm = 0.5) {
  const clusters = [];
  const visited = new Set();
  const validGrievances = grievances.filter(
    (g) => g.latitude !== null && g.latitude !== undefined && g.longitude !== null && g.longitude !== undefined
  );

  for (let i = 0; i < validGrievances.length; i++) {
    if (visited.has(validGrievances[i].id)) continue;

    const cluster = [validGrievances[i]];
    visited.add(validGrievances[i].id);

    for (let j = i + 1; j < validGrievances.length; j++) {
      if (visited.has(validGrievances[j].id)) continue;

      const dist = calculateHaversineDistanceKm(
        validGrievances[i].latitude,
        validGrievances[i].longitude,
        validGrievances[j].latitude,
        validGrievances[j].longitude
      );

      // If nearby and in the same department, group into cluster
      if (dist <= clusterRadiusKm && grievances[i].departmentCategory === grievances[j].departmentCategory) {
        cluster.push(grievances[j]);
        visited.add(grievances[j].id);
      }
    }

    if (cluster.length >= 2) {
      clusters.push({
        departmentCategory: grievances[i].departmentCategory,
        centerLatitude: cluster.reduce((sum, g) => sum + g.latitude, 0) / cluster.length,
        centerLongitude: cluster.reduce((sum, g) => sum + g.longitude, 0) / cluster.length,
        complaintCount: cluster.length,
        grievanceIds: cluster.map((g) => g.id),
        sampleTitles: cluster.map((g) => g.translatedText.slice(0, 50) + '...'),
        alertLevel: cluster.length >= 3 ? 'CRITICAL_CLUSTER' : 'MODERATE_CLUSTER'
      });
    }
  }

  return clusters;
}

module.exports = {
  calculateHaversineDistanceKm,
  formatDistance,
  filterWithinRadius,
  clusterGrievances
};
