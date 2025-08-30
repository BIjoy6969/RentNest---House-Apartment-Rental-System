# RentNest Backend (MERN)

Complete Express + MongoDB backend for a property rental system.

## Quick Start

```bash
cd rentnest-backend
npm install
cp .env.example .env
# edit .env to set MONGODB_URI and JWT_SECRET
npm run dev
```

Seed demo data (admin, landlord, tenant, 2 properties):
```bash
npm run seed
```

## API Base
`GET /` → `{ ok: true, name: 'RentNest API' }`

See `src/routes/*` for all endpoints.
