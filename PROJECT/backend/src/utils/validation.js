const { body, param, query } = require('express-validator');

/**
 * Validation rules for various API endpoints
 */
const validation = {
  // User validation rules
  user: {
    register: [
      body('name').trim().notEmpty().withMessage('Name is required'),
      body('email').isEmail().withMessage('Please provide a valid email'),
      body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
      body('role')
        .optional()
        .isIn(['admin', 'farmer', 'processor', 'distributor', 'retailer', 'consumer', 'stakeholder'])
        .withMessage('Invalid role')
    ],
    login: [
      body('email').isEmail().withMessage('Please provide a valid email'),
      body('password').notEmpty().withMessage('Password is required')
    ],
    update: [
      body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
      body('email').optional().isEmail().withMessage('Please provide a valid email'),
      body('role')
        .optional()
        .isIn(['admin', 'farmer', 'processor', 'distributor', 'retailer', 'consumer', 'stakeholder'])
        .withMessage('Invalid role')
    ],
    changePassword: [
      body('currentPassword').notEmpty().withMessage('Current password is required'),
      body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
    ]
  },

  // Product validation rules
  product: {
    create: [
      body('name').trim().notEmpty().withMessage('Product name is required'),
      body('description').trim().notEmpty().withMessage('Description is required'),
      body('productType').trim().notEmpty().withMessage('Product type is required'),
      body('farmer').isMongoId().withMessage('Valid farmer ID is required'),
      body('batch').optional().isMongoId().withMessage('Valid batch ID is required'),
      body('isOrganic').isBoolean().withMessage('isOrganic must be a boolean value'),
      body('certifications').optional().isArray().withMessage('Certifications must be an array'),
      body('certifications.*').optional().isMongoId().withMessage('Valid certification IDs are required'),
      body('images').optional().isArray().withMessage('Images must be an array')
    ],
    update: [
      body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
      body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
      body('productType').optional().trim().notEmpty().withMessage('Product type cannot be empty'),
      body('farmer').optional().isMongoId().withMessage('Valid farmer ID is required'),
      body('batch').optional().isMongoId().withMessage('Valid batch ID is required'),
      body('isOrganic').optional().isBoolean().withMessage('isOrganic must be a boolean value'),
      body('certifications').optional().isArray().withMessage('Certifications must be an array'),
      body('certifications.*').optional().isMongoId().withMessage('Valid certification IDs are required'),
      body('images').optional().isArray().withMessage('Images must be an array')
    ],
    addCertification: [
      body('certificationId').isMongoId().withMessage('Valid certification ID is required')
    ]
  },

  // Batch validation rules
  batch: {
    create: [
      body('harvestDate').isISO8601().withMessage('Valid harvest date is required'),
      body('processingMethods').isArray().withMessage('Processing methods must be an array'),
      body('processingMethods.*').notEmpty().withMessage('Processing method cannot be empty'),
      body('products').optional().isArray().withMessage('Products must be an array'),
      body('products.*').optional().isMongoId().withMessage('Valid product IDs are required'),
      body('handlers').isArray().withMessage('Handlers must be an array'),
      body('handlers.*').isMongoId().withMessage('Valid handler IDs are required')
    ],
    update: [
      body('harvestDate').optional().isISO8601().withMessage('Valid harvest date is required'),
      body('processingMethods').optional().isArray().withMessage('Processing methods must be an array'),
      body('processingMethods.*').optional().notEmpty().withMessage('Processing method cannot be empty'),
      body('products').optional().isArray().withMessage('Products must be an array'),
      body('products.*').optional().isMongoId().withMessage('Valid product IDs are required'),
      body('handlers').optional().isArray().withMessage('Handlers must be an array'),
      body('handlers.*').optional().isMongoId().withMessage('Valid handler IDs are required')
    ],
    addTraceabilityRecord: [
      body('action').notEmpty().withMessage('Action is required'),
      body('location').notEmpty().withMessage('Location is required'),
      body('timestamp').optional().isISO8601().withMessage('Valid timestamp is required'),
      body('handlerId').isMongoId().withMessage('Valid handler ID is required'),
      body('notes').optional().isString().withMessage('Notes must be a string')
    ]
  },

  // Certification validation rules
  certification: {
    create: [
      body('name').trim().notEmpty().withMessage('Certification name is required'),
      body('issuer').trim().notEmpty().withMessage('Issuer is required'),
      body('certificateHash').trim().notEmpty().withMessage('Certificate hash is required'),
      body('issueDate').isISO8601().withMessage('Valid issue date is required'),
      body('expiryDate').isISO8601().withMessage('Valid expiry date is required'),
      body('documentUrl').optional().isURL().withMessage('Valid document URL is required')
    ],
    update: [
      body('name').optional().trim().notEmpty().withMessage('Certification name cannot be empty'),
      body('issuer').optional().trim().notEmpty().withMessage('Issuer cannot be empty'),
      body('certificateHash').optional().trim().notEmpty().withMessage('Certificate hash cannot be empty'),
      body('issueDate').optional().isISO8601().withMessage('Valid issue date is required'),
      body('expiryDate').optional().isISO8601().withMessage('Valid expiry date is required'),
      body('documentUrl').optional().isURL().withMessage('Valid document URL is required'),
      body('isValid').optional().isBoolean().withMessage('isValid must be a boolean value')
    ],
    verify: [
      body('certificateHash').trim().notEmpty().withMessage('Certificate hash is required')
    ]
  },

  // QR Code validation rules
  qrcode: {
    generate: [
      body('productId').isMongoId().withMessage('Valid product ID is required')
    ],
    verify: [
      param('hash').trim().notEmpty().withMessage('QR code hash is required')
    ]
  },

  // ID parameter validation
  id: [
    param('id').isMongoId().withMessage('Valid ID is required')
  ],

  // Pagination and filtering
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sort').optional().isString().withMessage('Sort must be a string')
  ]
};

module.exports = validation;