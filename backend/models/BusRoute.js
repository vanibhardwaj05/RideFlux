const mongoose = require('mongoose');

const busRouteSchema = new mongoose.Schema({
  busNumber: { type: String, default: '' },
  source: { type: String, required: true },
  destination: { type: String, required: true },
  stops: { type: [String], default: [] },
  travelDate: { type: Date, required: true },
  departureTime: { type: String, required: true }, // e.g. "10:00 AM"
  totalSeats: { type: Number, default: 10 },
  availableSeats: { type: Number, default: 10 },
  fare: { type: Number, required: true },
  busDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('BusRoute', busRouteSchema);
