const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const qrcodeController = require('../controllers/qrcode.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @route   POST api/qrcodes/generate
 * @desc    Generate QR code for a product
 * @access  Private - Farmers, Admins
 */
router.post(
  '/generate',
  [
    authMiddleware.authenticate,
    authMiddleware.authorize(['farmer', 'admin']),
    check('productId', 'Product ID is required').not().isEmpty()
  ],
  qrcodeController.generateQRCode
);

/**
 * @route   GET api/qrcodes/verify/:hash
 * @desc    Verify QR code
 * @access  Public
 */
router.get('/verify/:hash', qrcodeController.verifyQRCode);

/**
 * @route   GET api/qrcodes/:hash
 * @desc    Get QR code by hash
 * @access  Public
 */
router.get('/:hash', qrcodeController.getQRCodeByHash);

/**
 * @route   GET api/qrcodes/product/:productId
 * @desc    Get QR codes by product
 * @access  Private - Product Owner, Admins
 */
router.get(
  '/product/:productId',
  authMiddleware.authenticate,
  qrcodeController.getQRCodesByProduct
);

/**
 * @route   PUT api/qrcodes/:hash/deactivate
 * @desc    Deactivate QR code
 * @access  Private - Product Owner, Admins
 */
router.put(
  '/:hash/deactivate',
  authMiddleware.authenticate,
  qrcodeController.deactivateQRCode
);

/**
 * @route   GET api/qrcodes/:hash/history
 * @desc    Get QR code scan history
 * @access  Private - Product Owner, Admins
 */
router.get(
  '/:hash/history',
  authMiddleware.authenticate,
  qrcodeController.getQRCodeScanHistory
);

module.exports = router;