const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  productType: {
    type: String,
    required: true,
    trim: true
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  certifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certification'
  }],
  isOrganic: {
    type: Boolean,
    default: true
  },
  blockchainInfo: {
    productId: {
      type: Number
    },
    transactionHash: {
      type: String,
      trim: true
    }
  },
  images: [{
    type: String
  }],
  qrCode: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;