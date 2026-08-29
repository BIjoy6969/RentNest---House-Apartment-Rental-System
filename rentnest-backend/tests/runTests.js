// tests/runTests.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const Property = require('../src/models/Property');
const Booking = require('../src/models/Booking');
const Application = require('../src/models/Application');
const Notification = require('../src/models/Notification');
const Complaint = require('../src/models/Complaint');
const Message = require('../src/models/Message');
const { calculateCompleteness } = require('../src/services/scoreService');
const { createNotification } = require('../src/services/notificationService');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rentnest';

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedCount++;
  }
}

async function runSuite() {
  console.log('\n========================================================');
  console.log('🧪 RENTNEST FULL REGRESSION & FUNCTIONALITY VERIFICATION');
  console.log('========================================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB database successfully.\n');

    // Clean up test data
    await User.deleteMany({ email: { $regex: /@fulltest\.com$/ } });

    console.log('--- 1. USER AUTHENTICATION & ROLES ---');
    const landlord = await User.create({
      name: 'Regression Landlord',
      email: 'landlord@fulltest.com',
      password: 'Password123!',
      role: 'landlord'
    });
    const tenant = await User.create({
      name: 'Regression Tenant',
      email: 'tenant@fulltest.com',
      password: 'Password123!',
      role: 'tenant'
    });
    const admin = await User.create({
      name: 'Regression Admin',
      email: 'admin@fulltest.com',
      password: 'Password123!',
      role: 'admin'
    });

    assert(await landlord.comparePassword('Password123!'), 'Landlord registered & password hashed');
    assert(await tenant.comparePassword('Password123!'), 'Tenant registered & password hashed');
    assert(await admin.comparePassword('Password123!'), 'Admin registered & password hashed');

    console.log('\n--- 2. PROPERTY LISTINGS & MULTI-IMAGE MANAGEMENT ---');
    const property = await Property.create({
      owner: landlord._id,
      title: 'Dhanmondi Lake-Facing 3BR Apartment',
      description: 'Bright and airy 3-bedroom flat with modern interiors and generator backup.',
      address: 'Road 12/A, Dhanmondi',
      city: 'Dhanmondi, Dhaka',
      state: 'Dhaka',
      country: 'Bangladesh',
      rent: 45000,
      bedrooms: 3,
      bathrooms: 3,
      amenities: ['Elevator', 'Generator', 'Balcony', 'Parking', '24/7 Security'],
      propertyType: 'apartment',
      status: 'available',
      images: [
        { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00', isPrimary: true, order: 0 },
        { url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0', isPrimary: false, order: 1 }
      ]
    });
    property.completenessScore = calculateCompleteness(property);
    await property.save();

    assert(property._id && property.images.length === 2, 'Landlord created property with multi-photo gallery');
    assert(property.completenessScore >= 80, `Completeness score calculated (${property.completenessScore}%)`);

    // Update Property
    property.rent = 48000;
    property.title = 'Updated Dhanmondi Lake-Facing 3BR Apartment';
    await property.save();
    const updatedProp = await Property.findById(property._id);
    assert(updatedProp.rent === 48000, 'Landlord updated property listing details');

    console.log('\n--- 3. WISHLIST & FAVORITES ---');
    tenant.favorites.push(property._id);
    await tenant.save();
    const tenantWithFavs = await User.findById(tenant._id).populate('favorites');
    assert(tenantWithFavs.favorites.length === 1, 'Tenant added property to favorites/wishlist');

    tenant.favorites.pull(property._id);
    await tenant.save();
    const tenantNoFavs = await User.findById(tenant._id);
    assert(tenantNoFavs.favorites.length === 0, 'Tenant removed property from favorites/wishlist');

    console.log('\n--- 4. VIEWING TOUR BOOKINGS ---');
    const scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const booking = await Booking.create({
      property: property._id,
      tenant: tenant._id,
      landlord: landlord._id,
      scheduledAt: scheduledDate,
      note: 'Would love an afternoon tour',
      status: 'pending'
    });
    assert(booking.status === 'pending', 'Tenant booked viewing appointment');

    // Landlord approves booking
    booking.status = 'approved';
    await booking.save();
    assert(booking.status === 'approved', 'Landlord approved viewing appointment');

    // Tenant cancels booking
    booking.status = 'cancelled';
    await booking.save();
    assert(booking.status === 'cancelled', 'Tenant/Landlord cancelled viewing appointment');

    console.log('\n--- 5. RENTAL SCREENING APPLICATION WORKFLOW ---');
    const application = await Application.create({
      property: property._id,
      tenant: tenant._id,
      landlord: landlord._id,
      form: {
        incomeMonthly: 180000,
        employmentStatus: 'Full Time Senior Engineer',
        creditScore: 740,
        occupants: 2,
        pets: false,
        message: 'Looking for a 2-year lease starting next month.'
      },
      score: 90,
      status: 'pending'
    });
    assert(application.score === 90, 'Tenant submitted rental screening application');

    // Landlord approves application & reserves property
    application.status = 'approved';
    await application.save();
    await Property.findByIdAndUpdate(property._id, { status: 'reserved' });
    const reservedProp = await Property.findById(property._id);
    assert(reservedProp.status === 'reserved', 'Landlord approved application and updated property status to reserved');

    console.log('\n--- 6. MESSAGING & CHAT ---');
    const message = await Message.create({
      sender: tenant._id,
      receiver: landlord._id,
      property: property._id,
      content: 'Hello, is parking included in the monthly rent?'
    });
    assert(message._id && message.content.includes('parking'), 'Tenant sent direct chat message to landlord');

    console.log('\n--- 7. NOTIFICATIONS & ALERTS ---');
    const notif = await createNotification({
      recipient: landlord._id,
      sender: tenant._id,
      type: 'message',
      title: 'New Inquiry',
      message: 'You received a new message regarding Dhanmondi apartment.',
      link: '/landlord'
    });
    assert(notif && notif.type === 'message', 'Notification generated and saved to database');

    console.log('\n--- 8. ADMIN MODERATION & COMPLAINTS ---');
    const complaint = await Complaint.create({
      reporter: tenant._id,
      targetType: 'property',
      targetId: property._id,
      reason: '[WRONG_PRICE] Rent shown differed from quoted amount',
      status: 'open'
    });
    assert(complaint.status === 'open', 'Abuse/Complaint report submitted to admin');

    complaint.status = 'resolved';
    await complaint.save();
    assert(complaint.status === 'resolved', 'Admin resolved complaint');

    // Admin flags property
    property.isFlagged = true;
    await property.save();
    const flaggedProp = await Property.findById(property._id);
    assert(flaggedProp.isFlagged === true, 'Admin flagged property for moderation');

    // Clean up
    await Property.deleteMany({ _id: property._id });
    await Booking.deleteMany({ _id: booking._id });
    await Application.deleteMany({ _id: application._id });
    await Message.deleteMany({ _id: message._id });
    await Complaint.deleteMany({ _id: complaint._id });
    await Notification.deleteMany({ recipient: { $in: [landlord._id, tenant._id, admin._id] } });
    await User.deleteMany({ email: { $regex: /@fulltest\.com$/ } });

    console.log('\n========================================================');
    console.log(`📊 REGRESSION TEST COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('========================================================\n');

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Regression Suite Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runSuite();
