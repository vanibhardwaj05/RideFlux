const mongoose = require('mongoose');

const busBookingSchema = new mongoose.Schema({
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'BusRoute', required: true },
  seatNumber: { type: Number, required: true },
  paymentMode: { type: String, default: 'Cash' }
}, { timestamps: true });

module.exports = mongoose.model('BusBooking', busBookingSchema);
