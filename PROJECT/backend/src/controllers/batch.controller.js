const Batch = require('../models/batch.model');
const Product = require('../models/product.model');
const { validationResult } = require('express-validator');
const blockchainService = require('../utils/blockchain');

/**
 * Create a new batch
 * @route POST /api/batches
 * @access Private - Farmers, Processors, Admins
 */
exports.createBatch = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      harvestDate, 
      processingMethods, 
      products,
      location
    } = req.body;

    // Verify products exist
    if (products && products.length > 0) {
      const productCount = await Product.countDocuments({
        _id: { $in: products }
      });

      if (productCount !== products.length) {
        return res.status(400).json({ message: 'One or more products not found' });
      }
    }

    // Initialize blockchain connection
    const web3 = await blockchainService.initWeb3();
    const contract = await blockchainService.initContract();
    const account = await blockchainService.getDefaultAccount();

    // Create batch on blockchain
    const result = await contract.methods.createBatch(
      harvestDate,
      JSON.stringify(processingMethods),
      JSON.stringify(location)
    ).send({ from: account, gas: 3000000 });

    // Get batch ID from blockchain transaction
    const batchId = result.events.BatchCreated.returnValues.batchId;
    const txHash = result.transactionHash;

    // Create batch in database
    const batch = new Batch({
      harvestDate,
      processingMethods,
      products,
      blockchainBatchId: batchId,
      transactionHash: txHash,
      handlers: [req.user.id], // Current authenticated user as initial handler
      traceabilityRecords: [{
        action: 'Batch Created',
        timestamp: Date.now(),
        location,
        handler: req.user.id,
        blockchainTransactionHash: txHash
      }]
    });

    // Save batch
    await batch.save();

    // Update products with batch reference
    if (products && products.length > 0) {
      await Product.updateMany(
        { _id: { $in: products } },
        { $push: { batches: batch._id } }
      );
    }

    res.status(201).json({
      success: true,
      data: batch,
      blockchainData: {
        batchId,
        transactionHash: txHash
      }
    });
  } catch (err) {
    console.error('Create batch error:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

/**
 * Get all batches
 * @route GET /api/batches
 * @access Private - Stakeholders
 */
exports.getBatches = async (req, res) => {
  try {
    const { page = 1, limit = 10, product } = req.query;
    
    // Build query
    const query = {};
    
    if (product) {
      query.products = product;
    }

    // Execute query with pagination
    const batches = await Batch.find(query)
      .populate('products', 'name productType')
      .populate('handlers', 'name role company')
      .populate('traceabilityRecords.handler', 'name role company')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    // Get total count
    const count = await Batch.countDocuments(query);

    res.json({
      batches,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalBatches: count
    });
  } catch (err) {
    console.error('Get batches error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get batch by ID
 * @route GET /api/batches/:id
 * @access Private - Stakeholders
 */
exports.getBatchById = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('products', 'name productType isOrganic farmer')
      .populate('handlers', 'name role company')
      .populate('traceabilityRecords.handler', 'name role company');

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Get blockchain data
    try {
      const contract = await blockchainService.initContract();
      const blockchainBatch = await contract.methods
        .getBatch(batch.blockchainBatchId)
        .call();

      res.json({
        batch,
        blockchainData: blockchainBatch
      });
    } catch (blockchainErr) {
      console.error('Blockchain data fetch error:', blockchainErr);
      // Still return the batch even if blockchain data fetch fails
      res.json({ batch, blockchainError: 'Failed to fetch blockchain data' });
    }
  } catch (err) {
    console.error('Get batch by ID error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Add traceability record to batch
 * @route POST /api/batches/:id/traceability
 * @access Private - Stakeholders
 */
exports.addTraceabilityRecord = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { action, location, notes } = req.body;

    // Find batch
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Initialize blockchain connection
    const web3 = await blockchainService.initWeb3();
    const contract = await blockchainService.initContract();
    const account = await blockchainService.getDefaultAccount();

    // Add traceability record to blockchain
    const result = await contract.methods.addTraceabilityRecord(
      batch.blockchainBatchId,
      action,
      JSON.stringify(location),
      notes || ''
    ).send({ from: account, gas: 1000000 });

    // Create traceability record
    const traceabilityRecord = {
      action,
      timestamp: Date.now(),
      location,
      notes,
      handler: req.user.id,
      blockchainTransactionHash: result.transactionHash
    };

    // Add handler if not already in handlers array
    if (!batch.handlers.includes(req.user.id)) {
      batch.handlers.push(req.user.id);
    }

    // Add traceability record
    batch.traceabilityRecords.push(traceabilityRecord);
    await batch.save();

    res.status(201).json({
      success: true,
      data: traceabilityRecord,
      blockchainData: {
        transactionHash: result.transactionHash
      }
    });
  } catch (err) {
    console.error('Add traceability record error:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

/**
 * Update batch
 * @route PUT /api/batches/:id
 * @access Private - Batch Handlers, Admins
 */
exports.updateBatch = async (req, res) => {
  try {
    const { harvestDate, processingMethods, products } = req.body;

    // Find batch
    let batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Check if user is a handler or admin
    const isHandler = batch.handlers.some(handler => handler.toString() === req.user.id);
    if (!isHandler && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this batch' });
    }

    // Update fields
    if (harvestDate) batch.harvestDate = harvestDate;
    if (processingMethods) batch.processingMethods = processingMethods;
    
    // Handle products update
    if (products) {
      // Verify products exist
      const productCount = await Product.countDocuments({
        _id: { $in: products }
      });

      if (productCount !== products.length) {
        return res.status(400).json({ message: 'One or more products not found' });
      }

      // Remove batch reference from old products
      await Product.updateMany(
        { batches: batch._id, _id: { $nin: products } },
        { $pull: { batches: batch._id } }
      );

      // Add batch reference to new products
      await Product.updateMany(
        { _id: { $in: products }, batches: { $ne: batch._id } },
        { $push: { batches: batch._id } }
      );

      batch.products = products;
    }

    // Save updated batch
    await batch.save();

    res.json({
      success: true,
      data: batch
    });
  } catch (err) {
    console.error('Update batch error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get batches by product
 * @route GET /api/batches/product/:productId
 * @access Private - Stakeholders
 */
exports.getBatchesByProduct = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const batches = await Batch.find({ products: req.params.productId })
      .populate('handlers', 'name role company')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Batch.countDocuments({ products: req.params.productId });

    res.json({
      batches,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalBatches: count
    });
  } catch (err) {
    console.error('Get batches by product error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get batches by handler
 * @route GET /api/batches/handler/:handlerId
 * @access Private - Stakeholders, Handler
 */
exports.getBatchesByHandler = async (req, res) => {
  try {
    // Check if user is requesting their own batches or is an admin
    if (req.params.handlerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view these batches' });
    }

    const { page = 1, limit = 10 } = req.query;
    
    const batches = await Batch.find({ handlers: req.params.handlerId })
      .populate('products', 'name productType')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Batch.countDocuments({ handlers: req.params.handlerId });

    res.json({
      batches,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalBatches: count
    });
  } catch (err) {
    console.error('Get batches by handler error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};