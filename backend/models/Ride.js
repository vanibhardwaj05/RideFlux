const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['searching', 'accepted', 'started', 'completed', 'cancelled'], default: 'searching' },
  pickupLocation: {
    address: { type: String, required: true },
    coordinates: { type: [Number], default: undefined }
  },
  dropLocation: {
    address: { type: String, required: true },
    coordinates: { type: [Number], default: undefined }
  },
  otp: { type: String }, // 4-digit OTP
  fare: { type: Number, required: true },
  paymentMode: { type: String, default: 'Cash' }
}, { timestamps: true });

module.exports = mongoose.model('Ride', rideSchema);
