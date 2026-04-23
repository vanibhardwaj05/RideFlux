# RideFlux 🚖🚌

A full-stack Cab and Bus Booking System built with the **Anti-Gravity Architecture** — fast, minimal, and dependency-light.

## Tech Stack

| Layer        | Technology                     |
|--------------|-------------------------------|
| Frontend     | Vanilla HTML, CSS, JavaScript  |
| Backend      | Node.js + Express              |
| Database     | MongoDB + Mongoose             |
| Real-time    | Socket.io                      |
| Auth         | JWT (JSON Web Tokens)          |

---

## Project Structure

```
RideFlux/
├── frontend/                   # Pure HTML/CSS/JS frontend
│   ├── index.html              # Landing page
│   ├── login.html              # Login page
│   ├── register.html           # Register page
│   ├── dashboard-passenger.html
│   ├── dashboard-cab.html
│   ├── dashboard-bus.html
│   ├── css/
│   │   └── style.css           # Complete design system
│   └── js/
│       ├── app.js              # Shared utilities (auth, fetch, toasts)
│       ├── passenger.js        # Passenger dashboard logic
│       ├── cab.js              # Cab driver dashboard logic
│       └── bus.js              # Bus driver dashboard logic
│
└── backend/                    # Node.js + Express backend
    ├── server.js               # Entry point
    ├── seed.js                 # Dummy data seeder
    ├── .env                    # Environment variables
    ├── models/
    │   ├── User.js             # User schema (passenger, cab_driver, bus_driver)
    │   ├── Ride.js             # Cab ride schema
    │   ├── BusRoute.js         # Bus route schema
    │   └── BusBooking.js       # Bus booking schema
    ├── routes/
    │   ├── auth.js             # POST /api/auth/register, /login
    │   ├── cab.js              # Cab ride lifecycle endpoints
    │   └── bus.js              # Bus search, booking, manifest
    ├── middleware/
    │   └── auth.js             # JWT verification + RBAC
    └── sockets/
        └── index.js            # Socket.io event handlers
```

---

## Getting Started

### 1. Prerequisites
- **Node.js** v18+
- **MongoDB** running locally on `127.0.0.1:27017`

### 2. Start the Backend
```bash
cd backend
npm install
npm run seed     # Seeds test users and bus routes
npm start        # Starts server on http://localhost:3000
```

### 3. Open the Frontend
Open `frontend/index.html` directly in your browser, or use VS Code **Live Server** extension.

---

## Test Accounts

| Role        | Email                  | Password      |
|-------------|------------------------|---------------|
| Passenger   | passenger@test.com     | password123   |
| Cab Driver  | driver@test.com        | password123   |
| Cab Driver  | cathy@test.com         | password123   |
| Bus Driver  | bus@test.com           | password123   |

---

## Features

### 🔐 Authentication
- JWT-based register & login
- Role-based access control (RBAC)
- Auto-redirect to correct dashboard after login
- Secure JWT storage in localStorage for session persistence
- Automatic token expiration handling and logout logic

#### Registration Flow
Users select their role (Passenger, Cab Driver, Bus Driver) during registration. For drivers, additional fields like phone number and vehicle details are mandatory to ensure service quality.

#### Login Flow
Upon successful login, the server returns a JWT which is stored on the client. All subsequent requests to protected `/api` routes include this token in the `Authorization` header.

### 🚖 Cab Booking
- Simple source and destination form with a live list of available cabs
- Cab numbers shown directly on the dashboard
- Requests are shared with all online cab drivers
- Full ride lifecycle: `searching → accepted → started → completed`
- 4-digit OTP verification to start a ride
- Real-time status updates via Socket.io

### 💬 Ephemeral Chat
- Real-time chat between passenger and cab driver during active ride
- Chat is room-based (ride ID) and **never stored** in the database
- Chat disappears automatically when ride completes

### 🚌 Bus Booking
- Simple dashboard list of available buses
- Bus numbers, source, destination, departure time, fare, and seats shown together
- Book a specific seat number
- Bus drivers view a passenger manifest per route

### 💵 Payment
- All payments are **Cash only**
- Drivers are prompted to collect cash on ride completion

### 📋 Ride History
- Passengers see past cab rides with driver info, fare, and status
- Cab drivers see their completed trips with passenger info

---

## Environment Variables (`backend/.env`)

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/Project
JWT_SECRET=supersecretjwtkey123
```

---

## API Endpoints

### Auth
| Method | Endpoint              | Access  |
|--------|-----------------------|---------|
| POST   | /api/auth/register    | Public  |
| POST   | /api/auth/login       | Public  |

### Cab
| Method | Endpoint                    | Access       |
|--------|-----------------------------|--------------|
| GET    | /api/cab/drivers            | Passenger    |
| POST   | /api/cab/request            | Passenger    |
| POST   | /api/cab/accept/:rideId     | Cab Driver   |
| POST   | /api/cab/start/:rideId      | Cab Driver   |
| POST   | /api/cab/complete/:rideId   | Cab Driver   |
| PUT    | /api/cab/availability       | Cab Driver   |
| GET    | /api/cab/available          | Cab Driver   |
| GET    | /api/cab/history            | Any auth     |
| GET    | /api/cab/:rideId            | Any auth     |

### Bus
| Method | Endpoint                    | Access       |
|--------|-----------------------------|--------------|
| GET    | /api/bus/search             | Public       |
| POST   | /api/bus/book               | Passenger    |
| GET    | /api/bus/my-routes          | Bus Driver   |
| GET    | /api/bus/manifest/:routeId  | Bus Driver   |

---

## Socket.io Events

| Event                | Direction          | Description                      |
|---------------------|--------------------|----------------------------------|
| `join-ride-room`     | Client → Server    | Join a ride's private room       |
| `send-message`       | Client → Server    | Send a chat message              |
| `receive-message`    | Server → Client    | Receive chat message             |
| `ride-accepted`      | Client → Server    | Driver accepted the ride         |
| `ride-started`       | Client → Server    | Ride started after OTP verified  |
| `ride-completed`     | Client → Server    | Ride completed                   |
| `ride-status-update` | Server → Client    | Notify room of status change     |

---

## Deployment

**Backend → Render.com**
- Set environment variables in Render dashboard
- Change `MONGO_URI` to your MongoDB Atlas connection string

**Frontend → Vercel / Netlify**
- Deploy the `frontend/` folder as a static site
- Update `API_URL` and `SOCKET_URL` in `frontend/js/app.js` to point to the Render backend URL
