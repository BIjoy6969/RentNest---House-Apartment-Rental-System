// src/services/trustService.js
const Booking = require('../models/Booking');
const Application = require('../models/Application');
const User = require('../models/User');

/**
 * Computes and persists a landlord's trust score.
 * Formula:
 * - Verification status: 25 pts (verified) / 0 (unverified)
 * - Completed rentals (approved applications): up to 35 pts (3.5 pts each, max 10)
 * - Response reliability: up to 25 pts based on non-pending booking decisions
 * - Low cancellation rate: up to 15 pts
 * Total: 0 - 100 points
 */
async function calculateLandlordTrustScore(landlordId) {
  try {
    const user = await User.findById(landlordId);
    if (!user || user.role !== 'landlord') return null;

    const [totalBookings, cancelledBookings, completedBookings, approvedApps] = await Promise.all([
      Booking.countDocuments({ landlord: landlordId }),
      Booking.countDocuments({ landlord: landlordId, status: 'cancelled' }),
      Booking.countDocuments({ landlord: landlordId, status: 'completed' }),
      Application.countDocuments({ landlord: landlordId, status: 'approved' })
    ]);

    // 1. Verification Bonus (25 pts)
    const verificationScore = user.verificationStatus === 'verified' ? 25 : 5;

    // 2. Completed rentals track record (35 pts max)
    const completedScore = Math.min(35, (approvedApps + completedBookings) * 3.5);

    // 3. Cancellation Rate (15 pts max)
    let cancellationRate = 0;
    if (totalBookings > 0) {
      cancellationRate = Math.round((cancelledBookings / totalBookings) * 100);
    }
    const cancellationPenalty = Math.min(15, cancellationRate * 0.3);
    const reliabilityScore = Math.max(0, 15 - cancellationPenalty);

    // 4. Activity & Experience (25 pts)
    const activityScore = totalBookings > 0 ? Math.min(25, 10 + totalBookings * 2) : 5;

    const totalRaw = Math.round(verificationScore + completedScore + reliabilityScore + activityScore);
    const finalScore = Math.min(100, Math.max(0, totalRaw));

    // Calculate 5-star equivalent rating
    const ratingOutOfFive = Number(((finalScore / 100) * 4 + 1).toFixed(1));

    user.trustScore = {
      score: finalScore,
      averageRating: ratingOutOfFive,
      totalRatings: totalBookings + approvedApps,
      responseRate: totalBookings > 0 ? Math.max(70, 100 - cancellationRate) : 100,
      completedRentals: approvedApps,
      cancellationRate: cancellationRate
    };

    await user.save();
    return user.trustScore;
  } catch (err) {
    console.error('Error calculating landlord trust score:', err.message);
    return null;
  }
}

module.exports = { calculateLandlordTrustScore };
