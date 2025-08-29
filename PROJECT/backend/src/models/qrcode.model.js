const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  verificationUrl: {
    type: String,
    trim: true
  },
  scans: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    location: {
      latitude: String,
      longitude: String
    }
  }],
  blockchainInfo: {
    transactionHash: {
      type: String,
      trim: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const QRCode = mongoose.model('QRCode', qrCodeSchema);

module.exports = QRCode;