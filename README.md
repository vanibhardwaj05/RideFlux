# ⚡️ RideFlux: The Ultimate High-Performance Booking Ecosystem

**RideFlux** is a high-performance transportation management system designed specifically for city cabs and long-route buses. Built with a focus on **Real-Time Synchronization**, **Geospatial Efficiency**, and a **Premium User Experience**, it bridges the gap between passengers and drivers through a seamless digital interface.

The application leverages a modern **"Glassmorphic"** design, using CSS variables and backdrop filters to create a sleek, futuristic interface that feels alive and interactive.

---

## 📑 Table of Contents
*   [Key Features](#-key-features)
*   [Technical Deep Dive](#-technical-deep-dive)
*   [Database Architecture](#-database-architecture)
*   [Real-Time Infrastructure](#-real-time-infrastructure)
*   [Security & RBAC](#-security--rbac)
*   [Tech Stack](#-tech-stack)
*   [Installation & Setup](#-installation--setup)

---

## 🚀 Key Features

### 🚕 The Passenger Experience
*   **Instant Ride Requests**: Book cabs with real-time fare calculation and nearby driver detection.
*   **Live Tracking**: View available drivers on the map and track your ride status in real-time.
*   **Secure OTP Entry**: Start rides safely with a 4-digit verification code provided to the driver.
*   **Ephemeral Chat**: Direct messaging with your driver for quick coordination during pickups.
*   **Travel History**: A centralized hub to review all past cab rides and bus journeys.

### 🛣 The Driver & Bus Management
*   **Availability Toggle**: Cab drivers can switch between "Active" and "Inactive" status with one tap.
*   **Smart Dispatch**: An automated matching system that holds ride requests in a "Searching" state until accepted.
*   **Bus Fleet Control**: Specialized dashboard for bus drivers to manage routes, stops, and seat availability.
*   **OTP Verification**: Integrated security check to ensure the right passenger is on board before starting the trip.

---

## ⚙️ Technical Deep Dive

### 🗺 The Geospatial Engine (2dsphere)
Finding the right driver at the right time is critical. RideFlux implements MongoDB's **2dsphere indexing** to handle high-velocity location data:

*   **Logic**: Every cab driver's location is stored as a GeoJSON `Point`.
*   **Efficiency**: The system uses `$near` and `$maxDistance` operators to query drivers within a specific radius, ensuring that passengers are only matched with drivers who are actually nearby.
*   **Real-time Updates**: Driver coordinates are updated via a specialized `/location` PUT endpoint, allowing for fluid tracking on the passenger's dashboard.

### 🔐 The OTP Security Protocol
To prevent fraud and ensure ride integrity, RideFlux uses a server-side generated 4-digit OTP:
1.  **Generation**: When a driver accepts a ride, a random 4-digit code is generated and saved to the `Ride` document.
2.  **Verification**: The ride status remains `accepted` until the driver enters the correct OTP provided by the passenger.
3.  **Activation**: Only upon successful OTP match does the status transition to `started`, triggering the fare meter and real-time route tracking.

---

## 🗄️ Database Architecture (MongoDB/Mongoose)

The data layer is built for relational efficiency within a NoSQL environment, using `ObjectId` references to link passengers, drivers, and routes.

### 👤 User Model
Handles multi-role authentication for passengers, cab drivers, and bus drivers.
```javascript
{
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['passenger', 'cab_driver', 'bus_driver'] },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] } // [long, lat]
    },
    isAvailable: { type: Boolean, default: false }
}
```

### 🚕 Ride Model
Tracks the lifecycle of a cab booking from request to completion.
```javascript
{
    passenger: { type: ObjectId, ref: 'User' },
    driver: { type: ObjectId, ref: 'User' },
    status: { type: String, enum: ['searching', 'accepted', 'started', 'completed', 'cancelled'] },
    otp: { type: String },
    fare: { type: Number },
    pickupLocation: { address: String, coordinates: [Number] }
}
```

---

## ⚡ Real-Time Infrastructure (Socket.io)

RideFlux uses bi-directional event emitters to ensure information flows instantly.

*   **Chat Sync**: Instant message delivery between passengers and drivers using the `sendMessage` and `receiveMessage` events.
*   **Ride Notifications**: When a passenger requests a ride, the server pings all nearby drivers instantly.
*   **Status Pings**: Changes in ride status (e.g., driver arrived, ride started) are pushed to the passenger's screen without needing a page refresh.

---

## 🛡️ Security & RBAC

We follow industry standards for data privacy and access control:

*   **JWT (JSON Web Tokens)**: All API endpoints are protected via signed tokens.
*   **Role-Based Access Control (RBAC)**: Custom middleware ensures that only cab drivers can accept rides and only passengers can request them.
*   **Bcrypt Hashing**: User passwords are encrypted with a salt factor of 10 to prevent unauthorized access.

---

## 💻 Tech Stack

### Frontend
*   **Vanilla JS**: Zero-framework, high-performance logic.
*   **Glassmorphic CSS**: Modern UI using backdrop-filter and CSS variables.
*   **Socket.io Client**: Real-time frontend synchronization.

### Backend
*   **Node.js & Express**: Scalable API architecture.
*   **Mongoose**: Schema-based modeling for MongoDB.
*   **Socket.io**: The real-time websocket engine.
*   **JWT**: Secure authentication.

---

## 🚀 Installation & Setup

### 1. Clone & Install
```bash
git clone https://github.com/vanibhardwaj05/RideFlux.git
cd RideFlux
npm install && npm run backend-install
```

### 2. Environment Variables
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_super_secret_key
```

### 3. Seed & Start
```bash
npm run seed  # Create test accounts
npm run dev   # Start the backend engine
```

### 4. Open App
Simply open `frontend/index.html` in your browser. Use `passenger@test.com` / `password123` to log in.

---

<div align="center">
  Built with ❤️ by Vani.
</div>
