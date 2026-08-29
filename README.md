# 🏡 RentNest — Trust-Aware Smart Rental Marketplace (V2)

[![Stack: MERN](https://img.shields.io/badge/Stack-MERN-blue.svg)](https://reactjs.org/)
[![Node: v18+](https://img.shields.io/badge/Node-v18+-green.svg)](https://nodejs.org/)
[![Security: Helmet & JWT](https://img.shields.io/badge/Security-Helmet%20%7C%20JWT%20%7C%20MongoSanitize-orange.svg)](https://helmetjs.github.io/)
[![Marketplace: Bangladesh-Ready](https://img.shields.io/badge/Marketplace-Bangladesh%20৳-emerald.svg)](#-bangladesh-first-rental-innovations)
[![Deployment: Vercel Ready](https://img.shields.io/badge/Deploy-Vercel-black.svg)](https://vercel.com/)

> **RentNest V2** transforms house and apartment renting into a modern, **trust-aware, two-sided decision rental marketplace** tailored for Bangladesh and modern rental ecosystems.

---

## 🌟 What Makes RentNest V2 Unique?

Unlike conventional rental portals that stop at standard CRUD listings, RentNest is engineered with **two-sided decision intelligence**, **deterministic trust scores**, **interactive day/night theme modes**, **automatic availability status tracking**, and **transparent cost breakdowns**.

```mermaid
graph LR
    A[🔍 Smart Recommendation Engine] --> B[📅 Request Viewing Tour]
    B --> C[🤝 Two-Sided Tour Decision Engine]
    C -->|Interested| D[📝 Digital Rental Screening & 5★ Landlord Rating]
    C -->|Not Interested| E[📊 Rejection Analytics & Audit Trail]
    D -->|Info Needed| F[💬 Additional Info Thread]
    D -->|Approved| G[🎉 Property Auto-Marked as Rented]
    F --> D
```

---

## ✨ Core Pillars & Features

### 1. 🌓 Seamless Day / Night Theme (Light & Dark Mode)
- **Universal theme switcher:** Smooth toggle between a clean daylight UI and an eye-friendly midnight dark mode.
- **Persistent Preferences:** Automatically saves theme choice to `localStorage` and synchronizes across the application.
- **Glassmorphic & Adaptive Components:** Modals, cards, navigation, and badges seamlessly adapt their contrast and typography.

### 2. 🖼️ Reliable Media Gallery & AI Fallback
- **Multi-Photo Uploads:** Support for multiple property photos with primary cover selection.
- **Smart Fallback:** Properties without uploaded photos automatically showcase aesthetic AI/architectural renders so listings never look broken.
- **Direct Asset Resolution:** Fast local/cloud static file routing.

### 3. 🤝 Two-Sided Post-Tour Decision System
- **After a viewing tour is completed**, both parties can formally record their decision:
  - **Tenants:** Submit `Interested`, `Not Interested` (with required reason categories: *Rent too high, Location didn't suit, Condition issues, Rules too strict, Found alternative*), or `Need More Time`.
  - **Landlords:** View real-time aggregated tour feedback, reason breakdown analytics, and update consideration status (`Considering`, `Ready to Proceed`, `Not Moving Forward`).
- **Complete Audit Trail:** Every status change is tracked with timestamps and actor roles.

### 4. 🛡️ Deterministic Landlord Trust & 5-Star Rating Engine
- **Tenant-to-Landlord Ratings:** Tenants can rate landlords on a 5-star impression scale when submitting applications.
- **Transparent Trust Formula (0–100 pts):**
  - **ID / Title Verification:** +25 pts
  - **Completed Leases Track Record:** +35 pts
  - **Tour Response & Cancellation Reliability:** +15 pts
  - **Listing Freshness & Activity:** +25 pts

### 5. 🇧🇩 Bangladesh-First Rental System & Transparent Costs
- **BD Rental Types:** Family Apartments, Bachelor Mess/Sublet, Student Hostels, Independent Houses, and Commercial spaces.
- **Transparent Cost Breakdown:**
  - Base Rent (৳ BDT)
  - Service / Maintenance Charges
  - Advance Deposit (e.g. 1–2 months) & Security Deposits
  - Utilities (Gas, Water, Internet, Parking space fees)
- **Tenant Policies & Rules:** Clearly displayed tags for `Family Allowed`, `Bachelor Allowed`, `Student Allowed`, `Pets`, `Smoking`, and `Min Lease Duration`.

### 6. 📝 Modern Digital Screening & Auto-Availability
- **Local Screening Metrics:** Occupation, income ratio, NID/Passport, emergency contact, and occupant count (replacing Western credit scores).
- **Auto-Unavailable on Approval:** Approving a tenant application automatically transitions the property to `rented` (unavailable), preventing double-booking.
- **Interactive Clarification Threads:** Landlords can request info (`info_requested`) and tenants can respond directly inside their dashboard.

### 7. 🚨 Admin Trust Moderation & Verification
- Single-click listing verification, landlord identity approval, and report resolution for suspicious activity.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, React Router v7, Context API, CSS3 Design Tokens / Variables, Axios |
| **Backend** | Node.js, Express.js, MongoDB Atlas with Mongoose ODM |
| **Security** | Helmet (Secure HTTP Headers & CORP), Express Mongo Sanitize, JWT Authentication, XSS Protection |
| **File Storage** | Multer file upload pipeline with primary image support |
| **Hosting / Deployment** | Vercel (Frontend & Serverless Node API ready via `vercel.json`) |

---

## 📡 API Overview

### 🔐 Authentication & Users
- `POST /api/auth/register` — Register tenant or landlord
- `POST /api/auth/login` — JWT Login with sanitized response
- `GET /api/auth/me` — Current user with trust score & preferences
- `PATCH /api/users/preferences` — Save tenant match preferences

### 🏢 Properties & Recommendations
- `GET /api/properties` — Filter by BD types, budget, bedrooms, bachelor/family policy, sort options
- `POST /api/properties` — Create listing with transparent cost & rule breakdown
- `GET /api/properties/:id` — Property details with view counter and cost calculation
- `GET /api/recommendations` — Personalized top matches for logged-in tenants

### 📅 Tour Bookings & 🤝 Decisions
- `POST /api/bookings` — Request tour viewing
- `PATCH /api/bookings/:id/status` — Approve/Reject/Complete tour
- `POST /api/tour-decisions` — Submit post-tour decision & feedback
- `GET /api/tour-decisions/mine` — Tenant's submitted decisions & history
- `GET /api/tour-decisions/incoming` — Landlord's incoming tour feedback

### 📝 Applications & Admin
- `POST /api/applications` — Submit digital screening application with 5★ rating
- `PATCH /api/applications/:id/status` — Approve/Reject (auto-marks property rented on approval)
- `POST /api/applications/:id/request-info` — Landlord requests clarification
- `POST /api/applications/:id/respond-info` — Tenant replies to request
- `POST /api/applications/:id/withdraw` — Tenant withdraws application
- `PATCH /api/admin/properties/:id/verify` — Admin property verification
- `PATCH /api/admin/users/:id/verify` — Admin landlord verification

---

## 🚀 Deployment Guide (Vercel)

### Option A: One-Click / GitHub Integration on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"** -> **"Import Git Repository"**.
2. Select `BIjoy6969/RentNest---House-Apartment-Rental-System`.
3. Set the following **Environment Variables** in Vercel settings:
   - `MONGO_URI`: `mongodb+srv://RentNest:RentNest1202@cluster0.1n9t8wj.mongodb.net/rentnest?retryWrites=true&w=majority&appName=Cluster0`
   - `JWT_SECRET`: `superlongrandomsecretstring`
   - `JWT_EXPIRES_IN`: `7d`
   - `REACT_APP_API_URL`: `/api` (or your full backend URL)
4. Click **Deploy**. Vercel uses the included `vercel.json` to deploy both frontend and backend seamlessly!

---

## 💻 Local Development Setup

### 1. Backend Setup
```bash
cd rentnest-backend
npm install
npm run dev
```

### 2. Frontend Setup
```bash
cd rentnest-frontend
npm install
npm start
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

---

## 👥 Course & Author Information
- **Project:** RentNest — House & Apartment Rental Marketplace (V2)
- **Course:** CSE470 (Software Engineering)
- **Author:** A Z M Bodruddoza Bijoy (Student ID: 22301678)
