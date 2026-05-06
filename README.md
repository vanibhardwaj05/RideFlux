<div align="center">
  # ⚡️ RideFlux: A Premium Transportation Ecosystem

  **RideFlux** is a high-performance management system designed specifically for city cabs and long-route buses. Built with a focus on **Reliability**, **Real-Time Communication**, and a **Premium User Experience**, it bridges the gap between passengers and drivers through a seamless digital interface.

  The application leverages a modern **"Glassmorphic"** design, using CSS variables and backdrop filters to create a sleek, futuristic interface that feels alive and interactive.
</div>

---

## 📑 Table of Contents
- [Key Features](#-key-features)
- [How it Works](#-how-it-works)
- [Database Architecture](#-database-architecture)
- [Real-Time Infrastructure](#-real-time-infrastructure)
- [Security & RBAC](#-security--rbac)
- [What we use](#-what-we-use)
- [Installation & Setup](#-installation--setup)

---

## 🚀 Key Features

### 🚕 The Passenger Experience (The Rider)
- **Instant Booking**: Request a cab with one tap and get matched with the best available driver.
- **Live Tracking**: Watch your ride approach in real-time with a dynamic map and ETA.
- **Secure OTP Entry**: Every journey is protected. Provide a 4-digit code to the driver to start your ride safely.
- **Instant Chat**: A floating message interface for direct, private coordination with your driver.
- **Travel History**: A clean dashboard to review all your past cab rides and bus tickets.

### 🛣 The Driver & Fleet Management (The Captain)
- **Availability Toggle**: Effortlessly switch between "Active" and "Inactive" modes with a single tap.
- **Smart Dispatch**: An automated system that holds ride requests until you're ready to accept.
- **Bus Fleet Control**: A specialized dashboard to manage long-distance routes and seat availability.
- **OTP Verification**: A unique verification step to ensure the right passenger is on board before the trip begins.

---

## 🛠 How it Works

### 🔐 The Ride Security Protocol
RideFlux ensures that every trip starts with total confidence. We implemented a custom server-side logic to handle ride activation:

1. **Generation**: When a driver accepts a ride, the system generates a unique 4-digit OTP.
2. **Verification**: The ride remains in a "Pending" state. It cannot start until the driver enters the correct code provided by the passenger.
3. **Activation**: Once verified, the ride transitions to "Started," triggering the fare meter and real-time tracking.

---

## 🗄️ Database Architecture (MongoDB/Mongoose)

The data layer is built for speed and efficiency. We use `ObjectId` references to link users, drivers, and rides in a scalable way.

### 👤 User Model
Handles roles for passengers, cab drivers, and bus managers.
```javascript
{
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['passenger', 'cab_driver', 'bus_driver'] },
    isAvailable: { type: Boolean, default: false }
}
```

### 🚕 Ride Model
Tracks the entire lifecycle of a trip from request to completion.
```javascript
{
    passenger: { type: ObjectId, ref: 'User' },
    driver: { type: ObjectId, ref: 'User' },
    status: { type: String, enum: ['searching', 'accepted', 'started', 'completed', 'cancelled'] },
    otp: { type: String },
    fare: { type: Number }
}
```

---

## ⚡ Real-Time Infrastructure (Socket.io)

RideFlux is alive. It uses **Bi-Directional Event Emitters** to ensure that information flows instantly between everyone.

- **Instant Messaging**: When you send a chat, it's delivered and displayed on the other screen in milliseconds.
- **Ride Notifications**: Drivers get instant "Pings" the moment a passenger requests a ride nearby.
- **Status Updates**: Your dashboard updates automatically when the ride is accepted or started—no refreshing needed.

---

## 🛡️ Security & RBAC

We follow industry standards to keep your data safe.

- **JWT (JSON Web Tokens)**: All sessions are secured with signed tokens for protected API access.
- **Role-Based Access Control**: Middleware ensures that only drivers can manage fleets and only passengers can book rides.
- **Bcrypt Hashing**: Passwords are encrypted with a high-security salt factor to prevent unauthorized access.

---

## 🎨 What we use

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Vanilla JS, Glassmorphic CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose) |
| **Real-time** | Socket.io |
| **Security** | JWT, Bcrypt |

---

## 🚀 Installation & Setup

1. **Clone & Install**
```bash
git clone https://github.com/vanibhardwaj05/RideFlux.git
cd RideFlux
npm install && npm run backend-install
```

2. **Configure Environment**
Create a `.env` file in the `backend/` folder:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_super_secret_key
```

3. **Launch**
```bash
npm run seed  # Create test accounts
npm run dev   # Start the backend engine
```

## 🎯 Final Thoughts

**RideFlux** was built to simplify how we move through the world. By combining secure data with instant communication, we’ve created a professional ecosystem for riders and captains alike.

Built with ❤️ for the future of mobility.

