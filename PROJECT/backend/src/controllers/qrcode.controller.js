const QRCode = require('../models/qrcode.model');
const Product = require('../models/product.model');
const { validationResult } = require('express-validator');
const blockchainService = require('../utils/blockchain');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Generate QR code for a product
 * @route POST /api/qrcodes/generate
 * @access Private - Farmers, Admins
 */
exports.generateQRCode = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId } = req.body;

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check ownership
    if (product.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to generate QR code for this product' });
    }

    // Generate unique hash for QR code
    const hash = crypto.createHash('sha256')
      .update(`${productId}-${Date.now()}-${Math.random()}`)
      .digest('hex');

    // Create QR code data
    const qrData = JSON.stringify({
      productId: product._id,
      blockchainProductId: product.blockchainProductId,
      hash,
      verificationUrl: `${process.env.FRONTEND_URL}/verify/${hash}`
    });

    // Ensure directory exists
    const qrDir = path.join(__dirname, '../../public/qrcodes');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    // Generate QR code image
    const qrCodeFileName = `qr_${hash}.png`;
    const qrCodePath = path.join(qrDir, qrCodeFileName);
    await qrcode.toFile(qrCodePath, qrData);

    // Initialize blockchain connection
    const web3 = await blockchainService.initWeb3();
    const contract = await blockchainService.initContract();
    const account = await blockchainService.getDefaultAccount();

    // Register QR code on blockchain
    const result = await contract.methods.registerQRCode(
      product.blockchainProductId,
      hash
    ).send({ from: account, gas: 1000000 });

    // Create QR code in database
    const qrCodeModel = new QRCode({
      hash,
      product: productId,
      imageUrl: `/qrcodes/${qrCodeFileName}`,
      verificationUrl: `${process.env.FRONTEND_URL}/verify/${hash}`,
      transactionHash: result.transactionHash,
      isActive: true
    });

    // Save QR code
    await qrCodeModel.save();

    // Update product with QR code
    product.qrCode = {
      hash,
      image: `/qrcodes/${qrCodeFileName}`,
      verificationUrl: `${process.env.FRONTEND_URL}/verify/${hash}`
    };
    await product.save();

    res.status(201).json({
      success: true,
      data: {
        qrCode: qrCodeModel,
        imageUrl: `/qrcodes/${qrCodeFileName}`,
        verificationUrl: `${process.env.FRONTEND_URL}/verify/${hash}`
      },
      blockchainData: {
        transactionHash: result.transactionHash
      }
    });
  } catch (err) {
    console.error('Generate QR code error:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

/**
 * Verify QR code
 * @route GET /api/qrcodes/verify/:hash
 * @access Public
 */
exports.verifyQRCode = async (req, res) => {
  try {
    const { hash } = req.params;

    // Find QR code
    const qrCode = await QRCode.findOne({ hash });
    if (!qrCode) {
      return res.status(404).json({ 
        verified: false,
        message: 'QR code not found' 
      });
    }

    // Check if QR code is active
    if (!qrCode.isActive) {
      return res.json({
        verified: false,
        message: 'QR code has been deactivated',
        qrCode
      });
    }

    // Get product details
    const product = await Product.findById(qrCode.product)
      .populate('farmer', 'name company location')
      .populate('certifications', 'name issuer issueDate expiryDate')
      .populate({
        path: 'batches',
        select: 'harvestDate processingMethods traceabilityRecords',
        populate: {
          path: 'traceabilityRecords.handler',
          select: 'name role company'
        }
      });

    if (!product) {
      return res.status(404).json({ 
        verified: false,
        message: 'Associated product not found' 
      });
    }

    // Verify on blockchain
    try {
      const contract = await blockchainService.initContract();
      const isVerified = await contract.methods
        .verifyQRCode(product.blockchainProductId, hash)
        .call();

      if (!isVerified) {
        return res.json({
          verified: false,
          message: 'QR code verification failed on blockchain',
          qrCode
        });
      }
    } catch (blockchainErr) {
      console.error('Blockchain verification error:', blockchainErr);
      return res.status(500).json({ 
        verified: false,
        message: 'Blockchain verification failed', 
        error: blockchainErr.message 
      });
    }

    // Record scan
    const scanInfo = {
      timestamp: Date.now(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      location: req.body.location || {}
    };

    qrCode.scanHistory.push(scanInfo);
    await qrCode.save();

    res.json({
      verified: true,
      message: 'QR code verified successfully',
      product,
      qrCode
    });
  } catch (err) {
    console.error('Verify QR code error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get QR code by hash
 * @route GET /api/qrcodes/:hash
 * @access Public
 */
exports.getQRCodeByHash = async (req, res) => {
  try {
    const { hash } = req.params;

    const qrCode = await QRCode.findOne({ hash })
      .populate('product', 'name description productType isOrganic');

    if (!qrCode) {
      return res.status(404).json({ message: 'QR code not found' });
    }

    res.json(qrCode);
  } catch (err) {
    console.error('Get QR code error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get QR codes by product
 * @route GET /api/qrcodes/product/:productId
 * @access Private - Product Owner, Admins
 */
exports.getQRCodesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check ownership
    if (product.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view QR codes for this product' });
    }

    const qrCodes = await QRCode.find({ product: productId })
      .sort({ createdAt: -1 });

    res.json(qrCodes);
  } catch (err) {
    console.error('Get QR codes by product error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Deactivate QR code
 * @route PUT /api/qrcodes/:hash/deactivate
 * @access Private - Product Owner, Admins
 */
exports.deactivateQRCode = async (req, res) => {
  try {
    const { hash } = req.params;

    // Find QR code
    const qrCode = await QRCode.findOne({ hash });
    if (!qrCode) {
      return res.status(404).json({ message: 'QR code not found' });
    }

    // Find product
    const product = await Product.findById(qrCode.product);
    if (!product) {
      return res.status(404).json({ message: 'Associated product not found' });
    }

    // Check ownership
    if (product.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to deactivate this QR code' });
    }

    // Deactivate QR code
    qrCode.isActive = false;
    await qrCode.save();

    res.json({
      success: true,
      message: 'QR code deactivated successfully',
      data: qrCode
    });
  } catch (err) {
    console.error('Deactivate QR code error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get QR code scan history
 * @route GET /api/qrcodes/:hash/history
 * @access Private - Product Owner, Admins
 */
exports.getQRCodeScanHistory = async (req, res) => {
  try {
    const { hash } = req.params;

    // Find QR code
    const qrCode = await QRCode.findOne({ hash });
    if (!qrCode) {
      return res.status(404).json({ message: 'QR code not found' });
    }

    // Find product
    const product = await Product.findById(qrCode.product);
    if (!product) {
      return res.status(404).json({ message: 'Associated product not found' });
    }

    // Check ownership
    if (product.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view scan history for this QR code' });
    }

    res.json({
      success: true,
      data: {
        qrCode: qrCode.hash,
        product: qrCode.product,
        scanHistory: qrCode.scanHistory
      }
    });
  } catch (err) {
    console.error('Get QR code scan history error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};