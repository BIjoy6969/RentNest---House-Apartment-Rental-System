// src/services/scoreService.js

/**
 * Calculates listing completeness score (0-100) based on real property data.
 */
exports.calculateCompleteness = (property) => {
  let score = 0;
  if (!property) return 0;

  // Title: 10 pts (meaningful title >= 10 chars)
  if (property.title && property.title.trim().length >= 10) score += 10;
  else if (property.title && property.title.trim().length > 0) score += 5;

  // Description: 20 pts (thorough description >= 50 chars)
  if (property.description && property.description.trim().length >= 50) score += 20;
  else if (property.description && property.description.trim().length >= 20) score += 10;

  // Location: 15 pts (address, city, state)
  if (property.address && property.city && property.state) score += 15;
  else if (property.city) score += 8;

  // Pricing & Rooms: 15 pts
  if (property.rent > 0 && property.bedrooms > 0 && property.bathrooms > 0) score += 15;

  // Amenities: 15 pts (>= 3 amenities = full, >= 1 = 8)
  const amenitiesCount = Array.isArray(property.amenities) ? property.amenities.length : 0;
  if (amenitiesCount >= 3) score += 15;
  else if (amenitiesCount >= 1) score += 8;

  // Photos: 25 pts
  const photosCount = Array.isArray(property.images) ? property.images.length : (property.imageUrl ? 1 : 0);
  if (photosCount >= 5) score += 25;
  else if (photosCount >= 3) score += 18;
  else if (photosCount >= 1) score += 10;

  return Math.min(100, Math.max(0, score));
};
