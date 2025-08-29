const Product = require('../models/product.model');
const { validationResult } = require('express-validator');
const blockchainService = require('../utils/blockchain');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

/**
 * Create a new product
 * @route POST /api/products
 * @access Private - Farmers, Admins
 */
exports.createProduct = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      name, 
      description, 
      productType, 
      isOrganic, 
      farmerId,
      harvestDate,
      location,
      certifications 
    } = req.body;

    // Initialize blockchain connection
    const web3 = await blockchainService.initWeb3();
    const contract = await blockchainService.initContract();
    const account = await blockchainService.getDefaultAccount();

    // Create product on blockchain
    const result = await contract.methods.createProduct(
      name,
      productType,
      isOrganic,
      farmerId,
      JSON.stringify(location)
    ).send({ from: account, gas: 3000000 });

    // Get product ID from blockchain transaction
    const productId = result.events.ProductCreated.returnValues.productId;
    const txHash = result.transactionHash;

    // Create product in database
    const product = new Product({
      name,
      description,
      productType,
      isOrganic,
      farmer: req.user.id, // Current authenticated user
      blockchainProductId: productId,
      transactionHash: txHash,
      harvestDate,
      location
    });

    // Generate QR code
    const qrData = JSON.stringify({
      productId: product._id,
      blockchainProductId: productId,
      name,
      farmer: req.user.id
    });

    // Ensure directory exists
    const qrDir = path.join(__dirname, '../../public/qrcodes');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    // Generate QR code image
    const qrCodeFileName = `product_${product._id}.png`;
    const qrCodePath = path.join(qrDir, qrCodeFileName);
    await QRCode.toFile(qrCodePath, qrData);

    // Set QR code URL
    product.qrCode = {
      image: `/qrcodes/${qrCodeFileName}`,
      verificationUrl: `${process.env.FRONTEND_URL}/verify/${product._id}`
    };

    // Save product
    await product.save();

    res.status(201).json({
      success: true,
      data: product,
      blockchainData: {
        productId,
        transactionHash: txHash
      }
    });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

/**
 * Get all products
 * @route GET /api/products
 * @access Public
 */
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, productType, isOrganic, farmer } = req.query;
    
    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (productType) query.productType = productType;
    if (isOrganic !== undefined) query.isOrganic = isOrganic === 'true';
    if (farmer) query.farmer = farmer;

    // Execute query with pagination
    const products = await Product.find(query)
      .populate('farmer', 'name company')
      .populate('certifications', 'name issuer issueDate expiryDate')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    // Get total count
    const count = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalProducts: count
    });
  } catch (err) {
    console.error('Get products error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get product by ID
 * @route GET /api/products/:id
 * @access Public
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('farmer', 'name company location')
      .populate('certifications', 'name issuer issueDate expiryDate documentUrl')
      .populate({
        path: 'batches',
        select: 'harvestDate processingMethods traceabilityRecords',
        populate: {
          path: 'traceabilityRecords.handler',
          select: 'name role company'
        }
      });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get blockchain data
    try {
      const contract = await blockchainService.initContract();
      const blockchainProduct = await contract.methods
        .getProduct(product.blockchainProductId)
        .call();

      res.json({
        product,
        blockchainData: blockchainProduct
      });
    } catch (blockchainErr) {
      console.error('Blockchain data fetch error:', blockchainErr);
      // Still return the product even if blockchain data fetch fails
      res.json({ product, blockchainError: 'Failed to fetch blockchain data' });
    }
  } catch (err) {
    console.error('Get product by ID error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update product
 * @route PUT /api/products/:id
 * @access Private - Product Owner, Admins
 */
exports.updateProduct = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      productType, 
      isOrganic,
      harvestDate,
      location,
      isActive 
    } = req.body;

    // Find product
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check ownership
    if (product.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // Update fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (productType) product.productType = productType;
    if (isOrganic !== undefined) product.isOrganic = isOrganic;
    if (harvestDate) product.harvestDate = harvestDate;
    if (location) product.location = location;
    if (isActive !== undefined) product.isActive = isActive;

    // Save updated product
    await product.save();

    res.json({
      success: true,
      data: product
    });
  } catch (err) {
    console.error('Update product error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete product
 * @route DELETE /api/products/:id
 * @access Private - Product Owner, Admins
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check ownership
    if (product.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    // Instead of deleting, mark as inactive
    product.isActive = false;
    await product.save();

    res.json({ message: 'Product marked as inactive' });
  } catch (err) {
    console.error('Delete product error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Add certification to product
 * @route POST /api/products/:id/certifications
 * @access Private - Product Owner, Admins
 */
exports.addCertification = async (req, res) => {
  try {
    const { certificationId } = req.body;

    // Find product
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check ownership
    if (product.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // Check if certification already added
    if (product.certifications.includes(certificationId)) {
      return res.status(400).json({ message: 'Certification already added to this product' });
    }

    // Add certification to product
    product.certifications.push(certificationId);
    await product.save();

    // Add certification to blockchain
    try {
      const web3 = await blockchainService.initWeb3();
      const contract = await blockchainService.initContract();
      const account = await blockchainService.getDefaultAccount();

      const result = await contract.methods.addCertification(
        product.blockchainProductId,
        certificationId
      ).send({ from: account, gas: 1000000 });

      res.json({
        success: true,
        data: product,
        blockchainData: {
          transactionHash: result.transactionHash
        }
      });
    } catch (blockchainErr) {
      console.error('Blockchain certification error:', blockchainErr);
      // Revert the database change if blockchain fails
      product.certifications.pop();
      await product.save();
      
      return res.status(500).json({ 
        message: 'Failed to add certification to blockchain', 
        error: blockchainErr.message 
      });
    }
  } catch (err) {
    console.error('Add certification error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Remove certification from product
 * @route DELETE /api/products/:id/certifications/:certId
 * @access Private - Product Owner, Admins
 */
exports.removeCertification = async (req, res) => {
  try {
    // Find product
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check ownership
    if (product.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // Remove certification
    const certIndex = product.certifications.indexOf(req.params.certId);
    if (certIndex === -1) {
      return res.status(404).json({ message: 'Certification not found on this product' });
    }

    product.certifications.splice(certIndex, 1);
    await product.save();

    res.json({
      success: true,
      data: product
    });
  } catch (err) {
    console.error('Remove certification error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get products by farmer
 * @route GET /api/products/farmer/:farmerId
 * @access Public
 */
exports.getProductsByFarmer = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const products = await Product.find({ farmer: req.params.farmerId })
      .populate('certifications', 'name issuer')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Product.countDocuments({ farmer: req.params.farmerId });

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalProducts: count
    });
  } catch (err) {
    console.error('Get products by farmer error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};