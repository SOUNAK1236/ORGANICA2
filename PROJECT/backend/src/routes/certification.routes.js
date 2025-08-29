const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const certificationController = require('../controllers/certification.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @route   POST api/certifications
 * @desc    Create a new certification
 * @access  Private - Admins, Certifiers
 */
router.post(
  '/',
  [
    authMiddleware.authenticate,
    authMiddleware.authorize(['admin', 'certifier']),
    check('name', 'Name is required').not().isEmpty(),
    check('issuer', 'Issuer is required').not().isEmpty(),
    check('certificateHash', 'Certificate hash is required').not().isEmpty(),
    check('issueDate', 'Issue date is required').isISO8601(),
    check('expiryDate', 'Expiry date is required').isISO8601()
  ],
  certificationController.createCertification
);

/**
 * @route   GET api/certifications
 * @desc    Get all certifications
 * @access  Public
 */
router.get('/', certificationController.getCertifications);

/**
 * @route   GET api/certifications/:id
 * @desc    Get certification by ID
 * @access  Public
 */
router.get('/:id', certificationController.getCertificationById);

/**
 * @route   PUT api/certifications/:id
 * @desc    Update certification
 * @access  Private - Admins, Certifiers
 */
router.put(
  '/:id',
  [
    authMiddleware.authenticate,
    authMiddleware.authorize(['admin', 'certifier']),
    check('name', 'Name is required').optional(),
    check('issuer', 'Issuer is required').optional(),
    check('certificateHash', 'Certificate hash is required').optional(),
    check('issueDate', 'Issue date must be a valid date').optional().isISO8601(),
    check('expiryDate', 'Expiry date must be a valid date').optional().isISO8601(),
    check('isValid', 'Valid status must be boolean').optional().isBoolean()
  ],
  certificationController.updateCertification
);

/**
 * @route   DELETE api/certifications/:id
 * @desc    Delete certification (mark as invalid)
 * @access  Private - Admins
 */
router.delete(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.isAdmin,
  certificationController.deleteCertification
);

/**
 * @route   POST api/certifications/verify
 * @desc    Verify certification hash
 * @access  Public
 */
router.post(
  '/verify',
  [
    check('certificateHash', 'Certificate hash is required').not().isEmpty()
  ],
  certificationController.verifyCertification
);

module.exports = router;