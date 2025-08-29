const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const batchController = require('../controllers/batch.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @route   POST api/batches
 * @desc    Create a new batch
 * @access  Private - Farmers, Processors, Admins
 */
router.post(
  '/',
  [
    authMiddleware.authenticate,
    authMiddleware.authorize(['farmer', 'processor', 'admin']),
    check('harvestDate', 'Harvest date is required').isISO8601(),
    check('processingMethods', 'Processing methods are required').isArray(),
    check('location', 'Location information is required').not().isEmpty()
  ],
  batchController.createBatch
);

/**
 * @route   GET api/batches
 * @desc    Get all batches
 * @access  Private - Stakeholders
 */
router.get('/', authMiddleware.authenticate, authMiddleware.isStakeholder, batchController.getBatches);

/**
 * @route   GET api/batches/:id
 * @desc    Get batch by ID
 * @access  Private - Stakeholders
 */
router.get('/:id', authMiddleware.authenticate, authMiddleware.isStakeholder, batchController.getBatchById);

/**
 * @route   POST api/batches/:id/traceability
 * @desc    Add traceability record to batch
 * @access  Private - Stakeholders
 */
router.post(
  '/:id/traceability',
  [
    authMiddleware.authenticate,
    authMiddleware.isStakeholder,
    check('action', 'Action is required').not().isEmpty(),
    check('location', 'Location is required').not().isEmpty()
  ],
  batchController.addTraceabilityRecord
);

/**
 * @route   PUT api/batches/:id
 * @desc    Update batch
 * @access  Private - Batch Handlers, Admins
 */
router.put(
  '/:id',
  [
    authMiddleware.authenticate,
    check('harvestDate', 'Harvest date must be a valid date').optional().isISO8601(),
    check('processingMethods', 'Processing methods must be an array').optional().isArray()
  ],
  batchController.updateBatch
);

/**
 * @route   GET api/batches/product/:productId
 * @desc    Get batches by product
 * @access  Private - Stakeholders
 */
router.get(
  '/product/:productId',
  authMiddleware.authenticate,
  authMiddleware.isStakeholder,
  batchController.getBatchesByProduct
);

/**
 * @route   GET api/batches/handler/:handlerId
 * @desc    Get batches by handler
 * @access  Private - Stakeholders, Handler
 */
router.get(
  '/handler/:handlerId',
  authMiddleware.authenticate,
  batchController.getBatchesByHandler
);

module.exports = router;