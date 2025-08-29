const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  issuer: {
    type: String,
    required: true,
    trim: true
  },
  certificateHash: {
    type: String,
    trim: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  documentUrl: {
    type: String,
    trim: true
  },
  blockchainInfo: {
    certificationId: {
      type: Number
    },
    transactionHash: {
      type: String,
      trim: true
    }
  },
  isValid: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Certification = mongoose.model('Certification', certificationSchema);

module.exports = Certification;