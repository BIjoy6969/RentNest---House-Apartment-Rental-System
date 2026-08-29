// src/controllers/recommendationController.js
const Property = require('../models/Property');
const User = require('../models/User');

/**
 * GET /api/recommendations
 * Computes transparent, weighted smart matches based on tenant rental preferences.
 */
exports.getRecommendations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const prefs = user?.rentalPreferences || {};

    const preferredAreas = prefs.preferredAreas || [];
    const minBudget = Number(prefs.minBudget) || 0;
    const maxBudget = Number(prefs.maxBudget) || 100000;
    const minBedrooms = Number(prefs.minBedrooms) || 1;
    const needsParking = !!prefs.needsParking;

    // Fetch active available properties
    const properties = await Property.find({
      isActive: true,
      isFlagged: false,
      status: 'available'
    })
      .populate('owner', 'name email role verificationStatus trustScore')
      .limit(60);

    const scored = properties.map((prop) => {
      let score = 0;
      const reasons = [];

      // 1. Location / Area Match (30 pts)
      const propCity = (prop.city || '').toLowerCase();
      const propArea = (prop.location?.area || '').toLowerCase();
      const propAddress = (prop.address || '').toLowerCase();

      const matchedArea = preferredAreas.find((a) => {
        const areaLower = a.toLowerCase();
        return propCity.includes(areaLower) || propArea.includes(areaLower) || propAddress.includes(areaLower);
      });

      if (matchedArea) {
        score += 30;
        reasons.push(`In your preferred area: ${matchedArea}`);
      } else if (preferredAreas.length === 0) {
        score += 20; // Default when no area restricted
      }

      // 2. Budget Match (25 pts)
      const rent = prop.rent || 0;
      if (rent >= minBudget && rent <= maxBudget) {
        score += 25;
        reasons.push(`Within your budget (৳${rent.toLocaleString()})`);
      } else if (rent < minBudget) {
        score += 20;
        reasons.push(`Below your minimum budget`);
      } else if (rent <= maxBudget * 1.15) {
        score += 10; // Slightly over budget
      }

      // 3. Bedrooms Match (20 pts)
      if (prop.bedrooms >= minBedrooms) {
        score += 20;
        reasons.push(`${prop.bedrooms} Bedrooms (you requested ${minBedrooms}+)`);
      } else {
        score += Math.max(5, 20 - (minBedrooms - prop.bedrooms) * 10);
      }

      // 4. Parking / Amenities Match (15 pts)
      const amenities = (prop.amenities || []).map((a) => a.toLowerCase());
      if (needsParking) {
        if (amenities.some((a) => a.includes('parking') || a.includes('garage'))) {
          score += 15;
          reasons.push('Parking space available');
        } else {
          score += 5;
        }
      } else {
        score += Math.min(15, (amenities.length || 0) * 3);
        if (amenities.length >= 3) {
          reasons.push(`${amenities.length} premium amenities included`);
        }
      }

      // 5. Landlord Trust Score Boost (10 pts)
      if (prop.owner?.verificationStatus === 'verified') {
        score += 10;
        reasons.push('Verified landlord listing');
      } else {
        score += 4;
      }

      const finalMatchPercentage = Math.min(99, Math.max(35, Math.round(score)));

      return {
        property: prop,
        matchScore: finalMatchPercentage,
        matchReasons: reasons
      };
    });

    // Sort by highest match score descending
    scored.sort((a, b) => b.matchScore - a.matchScore);

    res.json(scored.slice(0, 12));
  } catch (err) {
    next(err);
  }
};
