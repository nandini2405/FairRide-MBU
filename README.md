# FairRide MBU 🚗

A full-stack campus ride-booking platform built for Mohan Babu University (MBU), Tirupati. FairRide connects students with verified auto-rickshaw drivers for safe, affordable, and transparent campus transportation.

---

## 🌟 Features

### Student Side
- **Book Rides** — Select pickup, destination, and ride type (shared/full)
- **Real-time Tracking** — Live OpenStreetMap showing driver location
- **Safety Features** — Call driver, call family, SOS emergency alert
- **Payment** — UPI, Card (Razorpay), and Wallet payment options
- **AI Outing Planner** — Google Gemini AI suggests places near Tirupati
- **Ride Feedback** — Rate driver after each trip
- **Schedule Rides** — Book rides in advance
- **Predictions Page** — Live surge pricing, demand forecast, weather

### Driver Side
- **Dashboard** — Incoming ride requests, real-time earnings
- **OTP Verification** — Secure ride start with 4-digit OTP
- **In-Ride Features** — Speed, traffic, ETA tracking, SOS
- **Earnings** — Daily/weekly/total earnings with chart
- **Verification Status** — Real-time admin verification updates

### Admin Side
- **Driver Management** — Verify, reject, or remove drivers
- **Auto-refresh** — New drivers appear automatically every 10 seconds
- **Search & Filter** — Filter by status, search by name/phone
- **Export CSV** — Download driver data

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, Tailwind CSS, Vanilla JS |
| Maps | OpenStreetMap + Leaflet.js |
| Backend | Node.js + Express.js |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (JSON Web Tokens) |
| AI | Google Gemini 2.0 Flash |
| Payment | Razorpay (mock) |
| Icons | Phosphor Icons |
| Charts | Chart.js |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/FairRide-MBU.git
cd FairRide-MBU/fairride-mbu

# Install backend dependencies
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and API keys

# Run database migrations
npx prisma migrate dev

# Start the server
npm run dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://username:password@localhost:5432/fairride"
JWT_SECRET="your-secret-key"
PORT=3001
STATIC_ROOT="path/to/fairride-mbu"
GEMINI_API_KEY="your-gemini-api-key"
```

### Default Accounts

| Role | Email/Phone | Password |
|------|-------------|----------|
| Student | test@mbu.asia | test123 |
| Driver | 9999999999 | test123 |
| Admin | admin@mbu.asia | admin123 |

---

## 📁 Project Structure

```
fairride-mbu/
├── backend/
│   ├── src/
│   │   └── server.js          # Express API server
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   └── .env                   # Environment variables
├── assets/                    # CSS, JS, images
├── index.html                 # Login page
├── dashboard.html             # Student dashboard
├── waiting.html               # Waiting for driver
├── tracking.html              # Live ride tracking
├── payment.html               # Payment page
├── ride_feedback.html         # Ride feedback
├── driver_dashboard.html      # Driver dashboard
├── driver_in_ride.html        # Driver in-ride view
├── driver_earnings.html       # Driver earnings
├── admin.html                 # Admin console
└── predictions.html           # Demand predictions
```

---

## 🔄 Complete Ride Flow

```
Student books ride
      ↓
waiting.html (driver coming → map + call driver)
      ↓
Driver accepts → OTP popup on driver side
      ↓
Student tells OTP → Driver verifies → Ride starts
      ↓
tracking.html (live map + call family + SOS)
      ↓
Driver reaches destination → End Ride
      ↓
payment.html (student pays)
      ↓
ride_feedback.html (student rates driver)
      ↓
Driver earnings updated
```

---

## 🗺️ API Endpoints

### Auth
- `POST /api/auth/signup/student` — Student registration
- `POST /api/auth/signup/driver` — Driver registration
- `POST /api/auth/login` — Login for all roles

### Rides
- `POST /api/rides` — Book a ride
- `GET /api/rides/available` — Get available rides (drivers)
- `POST /api/rides/:id/accept` — Driver accepts ride
- `POST /api/rides/:id/start` — Start ride (OTP verified)
- `PATCH /api/rides/:id/status` — Update ride status

### Driver
- `GET /api/driver/profile` — Get driver profile
- `GET /api/driver/earnings` — Get earnings data

### Admin
- `GET /api/admin/drivers` — List all drivers
- `POST /api/admin/drivers/:id/verify` — Verify driver
- `POST /api/admin/drivers/:id/reject` — Reject driver
- `DELETE /api/admin/drivers/:id` — Remove driver

### AI & Stats
- `POST /api/ai/outing` — AI outing suggestions
- `GET /api/stats` — Platform statistics
- `GET /api/stats/hourly` — Hourly ride data

---

## 👨‍💻 Developer

Built as a final year project for MBU campus transportation system.

- **Platform**: FairRide MBU
- **University**: Mohan Babu University, Tirupati
- **Stack**: Full-stack Node.js + PostgreSQL

---

## 📄 License

MIT License — Free to use for educational purposes.
