const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// Helper to generate 4 digit OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

router.post('/request', auth, authorize('passenger'), async (req, res) => {
  try {
    const { pickupLocation, dropLocation, fare } = req.body;
    if (!pickupLocation?.address || !dropLocation?.address || !fare) {
      return res.status(400).json({ error: 'Pickup, destination, and fare are required' });
    }

    const drivers = await User.find({
      role: 'cab_driver',
      isAvailable: true
    }).select('_id');

    const ride = new Ride({
      passenger: req.user.userId,
      pickupLocation: {
        address: pickupLocation.address,
        coordinates: pickupLocation.coordinates
      },
      dropLocation: {
        address: dropLocation.address,
        coordinates: dropLocation.coordinates
      },
      fare,
      status: 'searching'
    });

    await ride.save();

    res.status(201).json({
      ride,
      nearbyDriversCount: drivers.length,
      availableDriversCount: drivers.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/drivers', auth, authorize('passenger'), async (req, res) => {
  try {
    const drivers = await User.find({
      role: 'cab_driver',
      isAvailable: true
    })
      .select('name phoneNumber carNumber isAvailable')
      .sort({ name: 1 });

    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/accept/:rideId', auth, authorize('cab_driver'), async (req, res) => {
  try {
    const { rideId } = req.params;
    
    const ride = await Ride.findById(rideId);
    if (!ride || ride.status !== 'searching') {
      return res.status(400).json({ error: 'Ride not available' });
    }

    if (ride.rejectedBy.some((driverId) => driverId.toString() === req.user.userId)) {
      return res.status(400).json({ error: 'Ride already rejected by you' });
    }

    ride.driver = req.user.userId;
    ride.status = 'accepted';
    ride.otp = generateOTP();
    await ride.save();

    // Mark driver as unavailable
    await User.findByIdAndUpdate(req.user.userId, { isAvailable: false });

    const populatedRide = await Ride.findById(ride._id)
      .populate('passenger', 'name phoneNumber')
      .populate('driver', 'name phoneNumber carNumber');

    res.json(populatedRide);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/reject/:rideId', auth, authorize('cab_driver'), async (req, res) => {
  try {
    const { rideId } = req.params;

    const ride = await Ride.findById(rideId);
    if (!ride || ride.status !== 'searching') {
      return res.status(400).json({ error: 'Ride not available' });
    }

    if (!ride.rejectedBy.some((driverId) => driverId.toString() === req.user.userId)) {
      ride.rejectedBy.push(req.user.userId);
      await ride.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/start/:rideId', auth, authorize('cab_driver'), async (req, res) => {
  try {
    const { rideId } = req.params;
    const { otp } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride || ride.status !== 'accepted') {
      return res.status(400).json({ error: 'Invalid ride status' });
    }

    if (ride.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    ride.status = 'started';
    await ride.save();

    res.json(ride);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/complete/:rideId', auth, authorize('cab_driver'), async (req, res) => {
  try {
    const { rideId } = req.params;

    const ride = await Ride.findById(rideId);
    if (!ride || ride.status !== 'started') {
      return res.status(400).json({ error: 'Invalid ride status' });
    }

    ride.status = 'completed';
    await ride.save();

    // Keep the driver offline after completion until they explicitly go online again.
    await User.findByIdAndUpdate(req.user.userId, { isAvailable: false });

    res.json(ride);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/cancel/:rideId', auth, authorize('cab_driver'), async (req, res) => {
  try {
    const { rideId } = req.params;

    const ride = await Ride.findById(rideId);
    if (!ride || (ride.status !== 'accepted' && ride.status !== 'started')) {
      return res.status(400).json({ error: 'Invalid ride status' });
    }

    ride.status = 'cancelled';
    await ride.save();

    // Make the driver available again
    await User.findByIdAndUpdate(req.user.userId, { isAvailable: true });

    res.json(ride);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const query = req.user.role === 'passenger' 
      ? { passenger: req.user.userId }
      : { driver: req.user.userId };

    const rides = await Ride.find(query)
      .populate('passenger', 'name')
      .populate('driver', 'name')
      .sort({ createdAt: -1 });

    res.json(rides);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/available', auth, authorize('cab_driver'), async (req, res) => {
  try {
    const rides = await Ride.find({
      status: 'searching',
      rejectedBy: { $ne: req.user.userId }
    })
      .populate('passenger', 'name phoneNumber')
      .sort({ createdAt: -1 });
    res.json(rides);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:rideId', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId)
      .populate('passenger', 'name email')
      .populate('driver', 'name email phoneNumber carNumber');
    res.json(ride);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

async function updateDriverAvailability(req, res) {
  try {
    const { coordinates, isAvailable } = req.body;

    const update = { isAvailable };

    if (Array.isArray(coordinates) && coordinates.length === 2) {
      update.location = {
        type: 'Point',
        coordinates
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      update,
      { new: true }
    ).select('isAvailable carNumber phoneNumber');

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}

router.put('/availability', auth, authorize('cab_driver'), updateDriverAvailability);
router.put('/location', auth, authorize('cab_driver'), updateDriverAvailability);

module.exports = router;
