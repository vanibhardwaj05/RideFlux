require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const BusRoute = require('./models/BusRoute');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing
    await User.deleteMany({});
    await BusRoute.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    // 1. Create Passenger
    const passenger = new User({
      name: 'John Passenger',
      email: 'passenger@test.com',
      password,
      role: 'passenger',
      phoneNumber: '9990001111'
    });
    await passenger.save();

    // 2. Create Cab Driver
    const cabDriver = new User({
      name: 'Dave Driver',
      email: 'driver@test.com',
      password,
      role: 'cab_driver',
      phoneNumber: '9876543210',
      carNumber: 'CAB-1024',
      isAvailable: true,
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139] // Delhi coords
      }
    });
    await cabDriver.save();

    const cabDriverTwo = new User({
      name: 'Cathy Cab',
      email: 'cathy@test.com',
      password,
      role: 'cab_driver',
      phoneNumber: '9876543211',
      carNumber: 'CAB-2048',
      isAvailable: true,
      location: {
        type: 'Point',
        coordinates: [77.2250, 28.6328]
      }
    });
    await cabDriverTwo.save();

    // 3. Create Bus Driver
    const busDriver = new User({
      name: 'Bob Busman',
      email: 'bus@test.com',
      password,
      role: 'bus_driver',
      phoneNumber: '9876543212',
      busNumber: 'BUS-3001'
    });
    await busDriver.save();

    // 4. Create Bus Routes
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const busRoute1 = new BusRoute({
      busNumber: 'BUS-3001',
      source: 'Delhi',
      destination: 'Jaipur',
      travelDate: tomorrow,
      departureTime: '08:00 AM',
      totalSeats: 40,
      availableSeats: 40,
      fare: 500,
      busDriver: busDriver._id
    });
    await busRoute1.save();

    const busRoute2 = new BusRoute({
      busNumber: 'BUS-3002',
      source: 'Mumbai',
      destination: 'Pune',
      travelDate: tomorrow,
      departureTime: '10:00 AM',
      totalSeats: 40,
      availableSeats: 40,
      fare: 300,
      busDriver: busDriver._id
    });
    await busRoute2.save();

    console.log('Dummy data seeded successfully!');
    console.log('-----------------------------------');
    console.log('Test Accounts (Password: password123)');
    console.log('Passenger: passenger@test.com');
    console.log('Cab Driver: driver@test.com');
    console.log('Cab Driver 2: cathy@test.com');
    console.log('Bus Driver: bus@test.com');
    console.log('-----------------------------------');

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
