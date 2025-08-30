require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Property = require('../src/models/Property');
const { ADMIN, LANDLORD, TENANT } = require('../src/constants/roles');

(async () => {
  try {
    await connectDB();

    await Promise.all([User.deleteMany({}), Property.deleteMany({})]);

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@rentnest.test',
      password: 'password123',
      role: ADMIN
    });
    const landlord = await User.create({
      name: 'Lana Lord',
      email: 'landlord@rentnest.test',
      password: 'password123',
      role: LANDLORD
    });
    const tenant = await User.create({
      name: 'Terry Tenant',
      email: 'tenant@rentnest.test',
      password: 'password123',
      role: TENANT
    });

    const props = await Property.insertMany([
      {
        owner: landlord._id,
        title: 'Sunny 2BR Apartment',
        description: 'Close to metro, great light',
        address: '123 Sunshine Rd',
        city: 'Dhaka',
        state: 'Dhaka',
        country: 'Bangladesh',
        rent: 25000,
        bedrooms: 2,
        bathrooms: 1,
        amenities: ['AC', 'Balcony']
      },
      {
        owner: landlord._id,
        title: 'Cozy Studio',
        description: 'Perfect for students',
        address: '45 Study Ln',
        city: 'Dhaka',
        state: 'Dhaka',
        country: 'Bangladesh',
        rent: 15000,
        bedrooms: 1,
        bathrooms: 1,
        amenities: ['WiFi']
      }
    ]);

    console.log('Seed complete.');
    console.log('Accounts:');
    console.log('Admin:    admin@rentnest.test / password123');
    console.log('Landlord: landlord@rentnest.test / password123');
    console.log('Tenant:   tenant@rentnest.test / password123');
    console.log('Properties created:', props.length);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
