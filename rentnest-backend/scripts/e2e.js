// scripts/e2e.js (Axios version)
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const http = axios.create({
  baseURL: BASE_URL,
  timeout: 10000
});

const pretty = (o) => JSON.stringify(o, null, 2);
const log = (label, obj) => console.log(`\n✅ ${label}\n${obj ? pretty(obj) : ''}`);

async function req(path, method = 'GET', token = '', body) {
  try {
    const res = await http.request({
      url: path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      data: body || undefined,
      validateStatus: () => true
    });
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`${method} ${path} → ${res.status} ${res.statusText}\n${pretty(res.data)}`);
    }
    return res.data;
  } catch (e) {
    // Show root cause (DNS/refused/timeout)
    if (e.code) {
      console.error(`\n❌ Network error (${e.code}) contacting ${BASE_URL}${path}`);
    }
    throw e;
  }
}

async function login(email, password) {
  const { token, user } = await req('/api/auth/login', 'POST', '', { email, password });
  log(`Logged in: ${user.role} (${user.email})`);
  return { token, user };
}

async function main() {
  console.log(`\n=== RentNest backend E2E @ ${BASE_URL} ===\n`);

  // 0) Health
  const health = await req('/', 'GET');
  log('Health OK', health);

  // 1) Logins (seed first if needed)
  const landlord = await login('landlord@rentnest.test', 'password123');
  const tenant   = await login('tenant@rentnest.test', 'password123');
  const admin    = await login('admin@rentnest.test', 'password123');

  // 2) Landlord creates a property
  const createPropBody = {
    title: 'Modern 2BR Flat',
    description: 'Nice area, fully furnished',
    address: '221B Baker Street',
    city: 'Dhaka',
    state: 'Dhaka',
    country: 'Bangladesh',
    rent: 30000,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ['Lift', 'Generator']
  };
  const createdProp = await req('/api/properties', 'POST', landlord.token, createPropBody);
  const propertyId = createdProp.property._id;
  log('Property created', createdProp.property);

  // 3) Public list
  const list = await req('/api/properties?q=&city=Dhaka&minRent=10000&maxRent=50000&bedrooms=1&page=1&limit=10');
  if (!list.items.find(p => p._id === propertyId)) throw new Error('Created property not found in list');
  log('Public property list OK', { count: list.items.length });

  // 4) Favorites add/get/remove (tenant)
  await req('/api/users/favorites', 'POST', tenant.token, { propertyId });
  const favs1 = await req('/api/users/favorites', 'GET', tenant.token);
  if (!favs1.favorites.find(p => p._id === propertyId)) throw new Error('Favorite not added');
  log('Favorite add/get OK', { favorites: favs1.favorites.map(p => p._id) });
  await req('/api/users/favorites', 'DELETE', tenant.token, { propertyId });
  const favs2 = await req('/api/users/favorites', 'GET', tenant.token);
  log('Favorite removed OK', { favorites: favs2.favorites.map(p => p._id) });

  // 5) Tenant books viewing
  const bookingCreated = await req('/api/bookings', 'POST', tenant.token, {
    propertyId,
    scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    note: 'Prefer weekend viewing'
  });
  const bookingId = bookingCreated.booking._id;
  log('Booking created', bookingCreated.booking);

  // 6) Landlord approves booking
  const bookingApproved = await req(`/api/bookings/${bookingId}/approve`, 'PATCH', landlord.token);
  if (bookingApproved.booking.status !== 'approved') throw new Error('Booking not approved');
  log('Booking approved', bookingApproved.booking);

  // 7) Tenant submits application
  const appCreated = await req('/api/applications', 'POST', tenant.token, {
    propertyId,
    form: {
      incomeMonthly: 100000,
      employmentStatus: 'Full-time',
      creditScore: 720,
      occupants: 2,
      pets: false,
      message: 'We love the neighborhood.'
    }
  });
  const applicationId = appCreated.application._id;
  log('Application submitted', { id: applicationId, score: appCreated.application.score });

  // 8) Landlord approves application
  const appApproved = await req(`/api/applications/${applicationId}/status`, 'PATCH', landlord.token, { status: 'approved' });
  if (appApproved.application.status !== 'approved') throw new Error('Application not approved');
  log('Application approved', { id: applicationId });

  // 9) Messaging
  const msg = await req('/api/messages', 'POST', tenant.token, {
    receiverId: landlord.user._id,
    propertyId,
    content: 'Hello! Is this property still available?'
  });
  log('Message sent', msg.message);
  const inboxTenant = await req('/api/messages/inbox', 'GET', tenant.token);
  const inboxLandlord = await req('/api/messages/inbox', 'GET', landlord.token);
  if (!inboxTenant.messages.length || !inboxLandlord.messages.length) throw new Error('Inbox empty after message');
  log('Messaging OK', { tenantInbox: inboxTenant.messages.length, landlordInbox: inboxLandlord.messages.length });

  // 10) Complaints + admin
  const complaint = await req('/api/complaints', 'POST', tenant.token, {
    targetType: 'property',
    targetId: propertyId,
    reason: 'Incorrect info'
  });
  log('Complaint created', complaint.complaint);
  const complaints = await req('/api/admin/complaints', 'GET', admin.token);
  const comp = complaints.complaints.find(c => c._id === complaint.complaint._id);
  if (!comp) throw new Error('Admin cannot see complaint');
  const compResolved = await req(`/api/admin/complaints/${comp._id}/status`, 'PATCH', admin.token, { status: 'resolved' });
  if (compResolved.complaint.status !== 'resolved') throw new Error('Complaint not resolved');
  log('Admin resolved complaint', compResolved.complaint);

  // 11) Admin flag/unflag property
  const flagged = await req(`/api/admin/properties/${propertyId}/flag`, 'PATCH', admin.token, { flagged: true });
  if (!flagged.property.isFlagged) throw new Error('Property not flagged');
  const unflagged = await req(`/api/admin/properties/${propertyId}/flag`, 'PATCH', admin.token, { flagged: false });
  if (unflagged.property.isFlagged) throw new Error('Property not unflagged');
  log('Admin flag/unflag OK', { flagged: flagged.property.isFlagged, unflagged: unflagged.property.isFlagged });

  console.log('\n🎉 All tests passed. Your backend works end-to-end.\n');
}

main().catch((e) => {
  console.error('\n❌ Test failed:\n', e.stack || e.message);
  process.exit(1);
});
