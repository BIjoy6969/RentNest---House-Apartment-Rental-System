require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Property = require('../src/models/Property');
const Booking = require('../src/models/Booking');
const Application = require('../src/models/Application');
const Notification = require('../src/models/Notification');
const { calculateCompleteness } = require('../src/services/scoreService');
const { ADMIN, LANDLORD, TENANT } = require('../src/constants/roles');

(async () => {
  try {
    await connectDB();

    console.log('Clearing existing database records...');
    await Promise.all([
      User.deleteMany({}),
      Property.deleteMany({}),
      Booking.deleteMany({}),
      Application.deleteMany({}),
      Notification.deleteMany({})
    ]);

    console.log('Creating demo users...');
    const admin = await User.create({
      name: 'Admin Moderator',
      email: 'admin@rentnest.test',
      password: 'password123',
      role: ADMIN
    });

    const landlord1 = await User.create({
      name: 'Tariqul Islam',
      email: 'landlord@rentnest.test',
      password: 'password123',
      role: LANDLORD
    });

    const landlord2 = await User.create({
      name: 'Nusrat Jahan',
      email: 'nusrat@rentnest.test',
      password: 'password123',
      role: LANDLORD
    });

    const tenant = await User.create({
      name: 'Farhan Ahmed',
      email: 'tenant@rentnest.test',
      password: 'password123',
      role: TENANT
    });

    console.log('Seeding diverse properties with curated real property photo collections...');

    const sampleProperties = [
      {
        owner: landlord1._id,
        title: 'Modern 3BR Luxury Apartment with Panoramic Balcony',
        description: 'Immaculate south-facing 3-bedroom luxury apartment featuring floor-to-ceiling double-glazed windows, Italian tiled floors, spacious modular kitchen with quartz countertops, generator backup, dedicated basement car parking, and 24/7 security with CCTV surveillance.',
        address: 'Road 11, Block D, Banani',
        city: 'Banani, Dhaka',
        state: 'Dhaka',
        country: 'Bangladesh',
        rent: 55000,
        bedrooms: 3,
        bathrooms: 3,
        amenities: ['Elevator', 'Standby Generator', '24/7 Security', 'Covered Parking', 'High-Speed WiFi', 'Balcony', 'Intercom'],
        propertyType: 'apartment',
        status: 'available',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200&auto=format&fit=crop',
            isPrimary: true,
            order: 0,
            caption: 'Modern luxury building facade'
          },
          {
            url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 1,
            caption: 'Spacious sunlit living room with hardwood accent'
          },
          {
            url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 2,
            caption: 'Master bedroom with king bed & large windows'
          },
          {
            url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 3,
            caption: 'Gourmet open kitchen with chimney & island'
          },
          {
            url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 4,
            caption: 'En-suite modern glass shower bathroom'
          },
          {
            url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 5,
            caption: 'Relaxing private balcony view'
          }
        ]
      },
      {
        owner: landlord1._id,
        title: 'Executive Lakeview Penthouse in Gulshan 2',
        description: 'Spectacular 4-bedroom penthouse overlooking the Gulshan lake. Features private rooftop terrace, custom smart lighting, walk-in closets, central water heating, full power backup, concierge reception, and high-speed dual elevators.',
        address: 'Road 71, Block NW(J), Gulshan 2',
        city: 'Gulshan, Dhaka',
        state: 'Dhaka',
        country: 'Bangladesh',
        rent: 110000,
        bedrooms: 4,
        bathrooms: 4,
        amenities: ['Lake View', 'Rooftop Garden', 'Full Generator Backup', 'Gym', 'Swimming Pool', 'Central AC', '2 Dedicated Parkings', 'Security'],
        propertyType: 'apartment',
        status: 'available',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?q=80&w=1200&auto=format&fit=crop',
            isPrimary: true,
            order: 0,
            caption: 'Executive penthouse lake-facing terrace'
          },
          {
            url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 1,
            caption: 'Grand open-concept living & dining hall'
          },
          {
            url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 2,
            caption: 'Luxury master suite with lounge area'
          },
          {
            url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 3,
            caption: 'Contemporary kitchen with premium appliances'
          },
          {
            url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 4,
            caption: 'Spa-style master bathroom with soaking tub'
          }
        ]
      },
      {
        owner: landlord2._id,
        title: 'Minimalist Nordic Studio Apartment near University Hub',
        description: 'Charming fully furnished studio flat ideal for single professionals or university students. Includes smart TV, study desk, ergonomic chair, kitchenette with microwave and induction cooker, split AC, and high-speed fiber internet.',
        address: 'Block C, Bashundhara R/A',
        city: 'Bashundhara, Dhaka',
        state: 'Dhaka',
        country: 'Bangladesh',
        rent: 18000,
        bedrooms: 1,
        bathrooms: 1,
        amenities: ['Furnished', 'High-Speed WiFi', 'Air Conditioning', 'CCTV Security', 'Elevator', 'Prepaid Meter'],
        propertyType: 'studio',
        status: 'available',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop',
            isPrimary: true,
            order: 0,
            caption: 'Cozy modern studio apartment overview'
          },
          {
            url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 1,
            caption: 'Comfortable queen bed with reading sconces'
          },
          {
            url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 2,
            caption: 'Compact modern kitchen setup'
          },
          {
            url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 3,
            caption: 'Clean minimalist tiled bathroom'
          }
        ]
      },
      {
        owner: landlord2._id,
        title: 'Peaceful Independent 4BR Duplex with Private Garden',
        description: 'Prestigious independent 2-story duplex surrounded by lush greenery and landscaped private lawn. Features 4 expansive bedrooms, family living room upstairs, helper quarters, 2-car garage, solar water heating, and water filtration system.',
        address: 'Sector 4, Uttara',
        city: 'Uttara, Dhaka',
        state: 'Dhaka',
        country: 'Bangladesh',
        rent: 78000,
        bedrooms: 4,
        bathrooms: 4,
        amenities: ['Private Garden', 'Duplex', '2-Car Garage', 'Servant Quarter', 'Solar Water Heating', 'Generator', 'Security System'],
        propertyType: 'house',
        status: 'available',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop',
            isPrimary: true,
            order: 0,
            caption: 'Private duplex residence with front lawn'
          },
          {
            url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 1,
            caption: 'Double-height ceiling living room'
          },
          {
            url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 2,
            caption: 'Peaceful second-floor family bedroom'
          },
          {
            url: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 3,
            caption: 'Spacious family dining and kitchen'
          },
          {
            url: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 4,
            caption: 'Lush green backyard and patio'
          }
        ]
      },
      {
        owner: landlord1._id,
        title: 'Spacious 3BR Family Flat with Natural Sunlight in Dhanmondi',
        description: 'Warm and inviting 3-bedroom family apartment situated in peaceful residential Dhanmondi. Close to leading English medium schools, hospitals, and parks. Boasts 3 wide verandahs, cross ventilation, tiled kitchen, and separate dining space.',
        address: 'Road 8/A, Dhanmondi',
        city: 'Dhanmondi, Dhaka',
        state: 'Dhaka',
        country: 'Bangladesh',
        rent: 42000,
        bedrooms: 3,
        bathrooms: 3,
        amenities: ['Elevator', 'Intercom', 'Gas Connection', 'Balcony', 'Covered Parking', 'Security Guard'],
        propertyType: 'apartment',
        status: 'available',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop',
            isPrimary: true,
            order: 0,
            caption: 'Sunlit living room with natural ventilation'
          },
          {
            url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 1,
            caption: 'Warm wooden aesthetic master bedroom'
          },
          {
            url: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 2,
            caption: 'Comfortable guest bedroom with study corner'
          },
          {
            url: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 3,
            caption: 'Functional family kitchen with cabinets'
          },
          {
            url: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 4,
            caption: 'Clean tiled bathroom with vanity mirror'
          }
        ]
      },
      {
        owner: landlord2._id,
        title: 'Serene Hill-View Luxury Villa in Khulshi',
        description: 'Exquisite hillside villa in exclusive South Khulshi residential area. Offers breathtaking panoramic hill views, private terrace garden, imported Spanish ceramic finishings, modern open kitchen, private driveway, and round-the-clock gated protection.',
        address: 'Khulshi Hills, Road 1',
        city: 'Khulshi, Chittagong',
        state: 'Chittagong',
        country: 'Bangladesh',
        rent: 95000,
        bedrooms: 4,
        bathrooms: 4,
        amenities: ['Hill View', 'Private Terrace', 'Covered Driveway', 'Full Generator Backup', 'Air Conditioning', 'Modern Modular Kitchen', '24/7 Gated Security'],
        propertyType: 'villa',
        status: 'available',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1200&auto=format&fit=crop',
            isPrimary: true,
            order: 0,
            caption: 'Modern luxury villa exterior'
          },
          {
            url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 1,
            caption: 'Scenic hill-facing living room'
          },
          {
            url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 2,
            caption: 'Master bedroom with wood beam ceilings'
          },
          {
            url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 3,
            caption: 'Open modern kitchen with breakfast bar'
          },
          {
            url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 4,
            caption: 'Luxury tiled bathroom with rainfall shower'
          }
        ]
      },
      {
        owner: landlord1._id,
        title: 'Affordable 2BR Flat near Mirpur Metro Station',
        description: 'Convenient and budget-friendly 2-bedroom flat located just a 3-minute walk from Mirpur-10 Metro Rail Station. Excellent connectivity, bright natural light, tiled floors, safe residential building with elevator and night guard.',
        address: 'Section 10, Block C, Mirpur',
        city: 'Mirpur, Dhaka',
        state: 'Dhaka',
        country: 'Bangladesh',
        rent: 22000,
        bedrooms: 2,
        bathrooms: 2,
        amenities: ['Near Metro Station', 'Elevator', 'Night Guard', 'Balcony', 'Tiled Floor', 'Gas Connection'],
        propertyType: 'apartment',
        status: 'available',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1200&auto=format&fit=crop',
            isPrimary: true,
            order: 0,
            caption: 'Bright and airy living space'
          },
          {
            url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 1,
            caption: 'Spacious bedroom with natural light'
          },
          {
            url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 2,
            caption: 'Neat and clean kitchen'
          },
          {
            url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200&auto=format&fit=crop',
            isPrimary: false,
            order: 3,
            caption: 'Tiled modern bathroom'
          }
        ]
      }
    ];

    // Compute completeness and set imageUrl for all items
    for (const prop of sampleProperties) {
      prop.completenessScore = calculateCompleteness(prop);
      prop.imageUrl = prop.images && prop.images.length > 0 ? prop.images[0].url : '';
      await Property.create(prop);
    }

    console.log(`\n✅ Database seed completed successfully!`);
    console.log(`Created ${sampleProperties.length} rich properties with multi-image collections.`);
    console.log('\n--- Login Credentials ---');
    console.log('Admin:    admin@rentnest.test / password123');
    console.log('Landlord: landlord@rentnest.test / password123');
    console.log('Tenant:   tenant@rentnest.test / password123');
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
