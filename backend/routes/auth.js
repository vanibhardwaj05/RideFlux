const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phoneNumber, carNumber, busNumber } = req.body;
    
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    if (!phoneNumber?.trim()) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (role === 'cab_driver' && !carNumber?.trim()) {
      return res.status(400).json({ error: 'Car number is required for cab drivers' });
    }

    if (role === 'bus_driver' && !busNumber?.trim()) {
      return res.status(400).json({ error: 'Bus number is required for bus drivers' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      phoneNumber: (phoneNumber || '').trim(),
      carNumber: role === 'cab_driver' ? (carNumber || '').trim().toUpperCase() : '',
      busNumber: role === 'bus_driver' ? (busNumber || '').trim().toUpperCase() : ''
    });

    await user.save();

    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        phoneNumber: user.phoneNumber,
        isAvailable: user.isAvailable,
        carNumber: user.carNumber,
        busNumber: user.busNumber
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        phoneNumber: user.phoneNumber,
        isAvailable: user.isAvailable,
        carNumber: user.carNumber,
        busNumber: user.busNumber
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
