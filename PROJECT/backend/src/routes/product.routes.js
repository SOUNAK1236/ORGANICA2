const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const productController = require('../controllers/product.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @route   POST api/products
 * @desc    Create a new product
 * @access  Private - Farmers, Admins
 */
router.post(
  '/',
  [
    authMiddleware.authenticate,
    authMiddleware.isFarmer,
    check('name', 'Name is required').not().isEmpty(),
    check('productType', 'Product type is required').not().isEmpty(),
    check('isOrganic', 'Organic status is required').isBoolean(),
    check('harvestDate', 'Harvest date is required').optional().isISO8601(),
    check('location', 'Location information is required').not().isEmpty()
  ],
  productController.createProduct
);

/**
 * @route   GET api/products
 * @desc    Get all products
 * @access  Public
 */
router.get('/', productController.getProducts);

/**
 * @route   GET api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', productController.getProductById);

/**
 * @route   PUT api/products/:id
 * @desc    Update product
 * @access  Private - Product Owner, Admins
 */
router.put(
  '/:id',
  [
    authMiddleware.authenticate,
    check('name', 'Name is required').optional(),
    check('productType', 'Product type is required').optional(),
    check('isOrganic', 'Organic status must be boolean').optional().isBoolean(),
    check('harvestDate', 'Harvest date must be a valid date').optional().isISO8601(),
    check('isActive', 'Active status must be boolean').optional().isBoolean()
  ],
  productController.updateProduct
);

/**
 * @route   DELETE api/products/:id
 * @desc    Delete product (mark as inactive)
 * @access  Private - Product Owner, Admins
 */
router.delete('/:id', authMiddleware.authenticate, productController.deleteProduct);

/**
 * @route   POST api/products/:id/certifications
 * @desc    Add certification to product
 * @access  Private - Product Owner, Admins
 */
router.post(
  '/:id/certifications',
  [
    authMiddleware.authenticate,
    check('certificationId', 'Certification ID is required').not().isEmpty()
  ],
  productController.addCertification
);

/**
 * @route   DELETE api/products/:id/certifications/:certId
 * @desc    Remove certification from product
 * @access  Private - Product Owner, Admins
 */
router.delete(
  '/:id/certifications/:certId',
  authMiddleware.authenticate,
  productController.removeCertification
);

/**
 * @route   GET api/products/farmer/:farmerId
 * @desc    Get products by farmer
 * @access  Public
 */
router.get('/farmer/:farmerId', productController.getProductsByFarmer);

module.exports = router;