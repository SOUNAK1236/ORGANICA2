const mongoose = require('mongoose');

const traceabilityRecordSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  handler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  handlerRole: {
    type: String,
    enum: ['farmer', 'processor', 'distributor', 'retailer'],
    required: true
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    name: String,
    latitude: String,
    longitude: String,
    additionalDetails: String
  },
  notes: {
    type: String,
    trim: true
  },
  blockchainInfo: {
    transactionHash: String
  }
});

const batchSchema = new mongoose.Schema({
  harvestDate: {
    type: Date
  },
  processingMethods: [{
    type: String,
    trim: true
  }],
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  handlers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  traceabilityRecords: [traceabilityRecordSchema],
  blockchainInfo: {
    batchId: {
      type: Number
    },
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

const Batch = mongoose.model('Batch', batchSchema);

module.exports = Batch;