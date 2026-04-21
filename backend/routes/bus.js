const express = require('express');
const router = express.Router();
const BusRoute = require('../models/BusRoute');
const BusBooking = require('../models/BusBooking');
const { auth, authorize } = require('../middleware/auth');

router.get('/search', async (req, res) => {
  try {
    const { source, destination, date } = req.query;
    
    const query = {};
    if (source) query.source = source;
    if (destination) query.destination = destination;
    if (date) {
      const searchDate = new Date(date);
      const nextDate = new Date(searchDate);
      nextDate.setDate(searchDate.getDate() + 1);
      
      query.travelDate = {
        $gte: searchDate,
        $lt: nextDate
      };
    }

    const routes = await BusRoute.find(query)
      .populate('busDriver', 'name')
      .sort({ travelDate: 1, departureTime: 1 });
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/book', auth, authorize('passenger'), async (req, res) => {
  try {
    const { routeId, seatNumber } = req.body;

    const route = await BusRoute.findById(routeId);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    if (route.availableSeats <= 0) {
      return res.status(400).json({ error: 'No seats available' });
    }

    // Check if seat is already booked
    const existingBooking = await BusBooking.findOne({ route: routeId, seatNumber });
    if (existingBooking) {
      return res.status(400).json({ error: 'Seat already booked' });
    }

    const booking = new BusBooking({
      passenger: req.user.userId,
      route: routeId,
      seatNumber
    });

    await booking.save();

    route.availableSeats -= 1;
    await route.save();

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my-routes', auth, authorize('bus_driver'), async (req, res) => {
  try {
    const routes = await BusRoute.find({ busDriver: req.user.userId }).sort({ travelDate: 1 });
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/manifest/:routeId', auth, authorize('bus_driver'), async (req, res) => {
  try {
    const { routeId } = req.params;

    const route = await BusRoute.findById(routeId);
    if (!route || route.busDriver.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to view this manifest' });
    }

    const bookings = await BusBooking.find({ route: routeId })
      .populate('passenger', 'name email')
      .sort({ seatNumber: 1 });

    res.json({ route, bookings });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
