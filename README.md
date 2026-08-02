# FairRide - MBU 🚗

A campus ride-sharing web application built for Mohan Babu University (MBU), Tirupati — connecting students for shared rides within campus.

## Features

- **Ride Booking** — Students can request rides by selecting pickup and destination
- **Live Location Tracking** — Tracking page for ride status updates
- **Driver Matching** — Matches ride requests with available drivers
- **Multi-page Flow** — Separate interfaces for booking, tracking, ride feedback, and driver dashboard
- **Admin Panel** — Basic driver management interface

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js

## Project Structure

```
fairride-mbu/
├── backend/              # Express server and APIs
├── assets/               # CSS, JS, images
├── index.html            # Login page
├── dashboard.html        # Student dashboard
├── booking.html          # Ride booking
├── tracking.html         # Live ride tracking
├── driver_dashboard.html # Driver dashboard
├── admin.html            # Admin panel
└── ...
```

## Achievement

Won 3rd Prize in a college-level Web Development Hackathon (100+ teams).


## How to Run Locally

 > **Note:** These are instructions for anyone cloning this repository. You need Node.js 18+ and PostgreSQL installed.

### 1. Clone and Setup
```bash
git clone https://github.com/nandini2405/FairRide-MBU.git
cd FairRide-MBU/fairride-mbu/backend
cp .env.example .env
# Edit .env with your actual database URL and API keys

```
### 2. Install Dependencies
```bash
npm install
```
### 3. Run Database Migrations
```bash
npx prisma migrate dev
```
### 4. Start Backend Server
```bash
npm start
# Server runs on http://localhost:3001
```
### 5. Access Frontend
Open `fairride-mbu/index.html` in your browser, or visit `http://localhost:3001`.

## API Endpoints

| Endpoint                   | Method | Description          |
| -------------------------- | ------ | -------------------- |
| `/api/auth/signup/student` | POST   | Student registration |
| `/api/auth/signup/driver`  | POST   | Driver registration  |
| `/api/auth/login`          | POST   | User login           |
| `/api/rides`               | POST   | Request a ride       |
| `/api/rides/available`     | GET    | List available rides |
| `/api/rides/:id/accept`    | POST   | Driver accepts ride  |
| `/api/admin/drivers`       | GET    | Admin: list drivers  |
| `/api/ai/outing`           | POST   | AI outing planner    |
| `/api/stats`               | GET    | Platform statistics  |

## Achievement
Won 3rd Prize in a college-level Web Development Hackathon (100+ teams).

## Developer
Built by Nandini Kancharla as a campus project for MBU.

