const mongoose = require('mongoose');

const busBookingSchema = new mongoose.Schema({
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'BusRoute', required: true },
  seatNumber: { type: Number, required: true },
  boardingPoint: { type: String, required: true },
  boardingTime: { type: String, required: true },
  status: { type: String, enum: ['active', 'cancelled', 'cancelled_by_driver'], default: 'active' },
  paymentMode: { type: String, default: 'Cash' }
}, { timestamps: true });

module.exports = mongoose.model('BusBooking', busBookingSchema);
