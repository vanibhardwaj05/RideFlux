<div align="center">
  # ⚡️ RideFlux
  ### Redefining Urban Mobility with Precision and Elegance

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Status: Active](https://img.shields.io/badge/Status-Active-brightgreen.svg)]()
  [![Tech: Node.js](https://img.shields.io/badge/Backend-Node.js-339933.svg)]()
  [![Tech: Vanilla JS](https://img.shields.io/badge/Frontend-Vanilla_JS-F7DF1E.svg)]()

  **RideFlux** is a smart booking system built to make traveling easier. Whether you're booking a quick cab or a long-distance bus, RideFlux keeps everything simple, secure, and on time.
</div>

---

## 👋 Welcome to RideFlux

Transportation shouldn't be complicated. We built RideFlux to solve the everyday frustrations of booking rides. It’s fast, it’s reliable, and it looks great too.

### Why you'll love it:
- **See everything in real-time**: No more wondering where your ride is.
- **Stay safe**: Every ride is verified with a simple 4-digit code.
- **No fuss**: Just a clean, easy-to-use interface that gets the job done.

---

## 🛠 Features at a Glance

### 🚕 For Passengers
- **Smart Booking**: One-tap ride requests with intelligent nearby driver detection.
- **Live Map Tracking**: Watch your ride approach in real-time with precise ETA.
- **Secure OTP Entry**: Start your journey with confidence using our 4-digit verification.
- **Direct Chat**: Direct, ephemeral messaging for effortless coordination.

### 🛣 For Drivers & Fleet Managers
- **Availability Toggle**: Effortlessly switch between active and inactive modes.
- **Automated Dispatch**: Smart matching logic that optimizes ride requests.
- **Bus Fleet Control**: Specialized dashboard for managing routes and seat availability.
- **Trip History**: Detailed logs of all completed journeys and earnings.

---

## 🚀 Getting Started

We've made the setup process as easy as possible. Just follow these steps:

### 1. Install
```bash
git clone https://github.com/vanibhardwaj05/RideFlux.git
cd RideFlux
npm install && npm run backend-install
```

### 2. Setup
Create a `.env` file in the `backend/` folder and add these:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_super_secret_key
```

### 3. Start
```bash
npm run seed  # This creates some test accounts for you
npm run dev   # This starts the backend
```

### 4. Try it out
Open `frontend/index.html` in your browser. 
**Use these to log in:**
- **Email:** `passenger@test.com`
- **Password:** `password123`

---

## 🛠 How it works

### 🗺 Geospatial Intelligence
We use MongoDB's **2dsphere indexing** to handle complex location queries. By utilizing `$near` and `$maxDistance` operators, we ensure that matching is geographically accurate and lightning-fast.

### 🔐 The Security Protocol
- **JWT Authentication**: All sessions are secured with signed tokens.
- **Bcrypt Protection**: Industry-standard password hashing.
- **RBAC**: Strict Role-Based Access Control ensures data integrity across Passenger and Driver roles.

### ⚡ Real-Time Engine
Powered by **Socket.io**, RideFlux maintains a persistent connection for:
- Instant Chat delivery.
- Real-time ride status notifications.
- Fluid driver location updates on the map.

---

## 🎨 What we use

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Vanilla JS, Glassmorphic CSS, Socket.io Client |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose) |
| **Real-time** | Socket.io |
| **Auth** | JWT (JSON Web Tokens) |

---

<div align="center">
  Built with ❤️ for the future of mobility.
</div>

