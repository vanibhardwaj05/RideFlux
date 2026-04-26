const express = require('express');
const router = express.Router();
const BusRoute = require('../models/BusRoute');
const BusBooking = require('../models/BusBooking');
const { auth, authorize } = require('../middleware/auth');

router.get('/search', async (req, res) => {
  try {
    const { source, destination, date } = req.query;
    
    const query = { availableSeats: { $gt: 0 } };
    
    if (date) {
      const searchDate = new Date(date);
      const nextDate = new Date(searchDate);
      nextDate.setDate(searchDate.getDate() + 1);
      
      query.travelDate = {
        $gte: searchDate,
        $lt: nextDate
      };
    }

    // Since we need to check if source comes before destination in the full path [source, ...stops, destination],
    // we fetch matching date routes and filter in JS if source/destination are provided.
    // If it's a huge DB, we'd use complex MongoDB aggregation, but this is fine for this scale.
    let routes = await BusRoute.find(query)
      .populate('busDriver', 'name phoneNumber')
      .sort({ travelDate: 1, departureTime: 1 });

    if (source || destination) {
      routes = routes.filter(route => {
        const fullPath = [route.source, ...route.stops.map(s => s.name), route.destination].map(s => s.toLowerCase());
        
        const srcIdx = source ? fullPath.indexOf(source.toLowerCase()) : 0;
        const destIdx = destination ? fullPath.indexOf(destination.toLowerCase()) : fullPath.length - 1;

        if (srcIdx === -1 || destIdx === -1) return false;
        if (source && destination && srcIdx >= destIdx) return false;
        
        return true;
      });
    }

    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my-bookings', auth, authorize('passenger'), async (req, res) => {
  try {
    const bookings = await BusBooking.find({ passenger: req.user.userId })
      .populate({
        path: 'route',
        populate: { path: 'busDriver', select: 'name phoneNumber' }
      })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/book', auth, authorize('passenger'), async (req, res) => {
  try {
    const { routeId, seatNumber, boardingPoint } = req.body;

    const route = await BusRoute.findById(routeId);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    if (route.availableSeats <= 0) {
      return res.status(400).json({ error: 'No seats available' });
    }

    // Check if seat is already booked
    const existingBooking = await BusBooking.findOne({ route: routeId, seatNumber, status: 'active' });
    if (existingBooking) {
      return res.status(400).json({ error: 'Seat already booked' });
    }

    // Find boarding time from route stops or source
    let boardingTime = route.departureTime;
    if (boardingPoint !== route.source) {
      const stop = route.stops.find(s => s.name === boardingPoint);
      if (stop) boardingTime = stop.arrivalTime;
    }

    const booking = new BusBooking({
      passenger: req.user.userId,
      route: routeId,
      seatNumber,
      boardingPoint,
      boardingTime,
      status: 'active'
    });

    await booking.save();

    route.availableSeats -= 1;
    await route.save();

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/booking/cancel/:bookingId', auth, authorize('passenger'), async (req, res) => {
  try {
    const booking = await BusBooking.findOne({ _id: req.params.bookingId, passenger: req.user.userId, status: 'active' });
    if (!booking) {
      return res.status(404).json({ error: 'Active booking not found' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Re-increment available seats
    await BusRoute.findByIdAndUpdate(booking.route, { $inc: { availableSeats: 1 } });

    res.json({ success: true });
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

    const bookings = await BusBooking.find({ route: routeId, status: 'active' })
      .populate('passenger', 'name email phoneNumber')
      .sort({ seatNumber: 1 });

    res.json({ route, bookings });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/create-route', auth, authorize('bus_driver'), async (req, res) => {
  try {
    const { busId, source, destination, stops, travelDate, departureTime, fare } = req.body;

    if (!busId || !source || !destination || !travelDate || !departureTime || !fare) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const route = new BusRoute({
      busId,
      source,
      destination,
      stops: stops || [],
      travelDate: new Date(travelDate),
      departureTime,
      fare,
      busDriver: req.user.userId,
      totalSeats: 10,
      availableSeats: 10
    });

    await route.save();
    res.status(201).json(route);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/route/:routeId', auth, authorize('bus_driver'), async (req, res) => {
  try {
    const route = await BusRoute.findOne({ _id: req.params.routeId, busDriver: req.user.userId });
    if (!route) {
      return res.status(404).json({ error: 'Route not found or unauthorized' });
    }
    
    // Instead of deleting everything, we mark the route as deleted/cancelled 
    // and update all bookings to cancelled_by_driver
    await BusBooking.updateMany({ route: req.params.routeId, status: 'active' }, { status: 'cancelled_by_driver' });
    await BusRoute.deleteOne({ _id: req.params.routeId });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
