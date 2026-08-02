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
## How to Run Locally

### Prerequisites
- Node.js 18+
- PostgreSQL installed and running
- (Optional) Docker for containerized database

### 1. Clone and Setup
```bash
git clone https://github.com/nandini2405/FairRide-MBU.git
cd FairRide-MBU/fairride-mbu/backend
cp .env.example .env
# Edit .env with your actual database URL and API keys

### Prerequisites
- Node.js 18+
- PostgreSQL installed and running
- (Optional) Docker for containerized database

### 1. Database Setup
```bash
cd fairride-mbu/backend
cp .env.example .env
# Edit .env and set your DATABASE_URL

## Developer

Built by Nandini Kancharla as a campus project for MBU.
