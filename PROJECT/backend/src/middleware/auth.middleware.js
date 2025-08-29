const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * Middleware to authenticate JWT token
 * Adds user object to request if token is valid
 */
exports.authenticate = async (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

/**
 * Middleware to check if user has required role
 * @param {Array} roles - Array of allowed roles
 */
exports.authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if user role is in the allowed roles
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }

    next();
  };
};

/**
 * Middleware to check if user is an admin
 */
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};

/**
 * Middleware to check if user is a farmer
 */
exports.isFarmer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (req.user.role !== 'farmer' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Farmer access required' });
  }

  next();
};

/**
 * Middleware to check if user is a processor
 */
exports.isProcessor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (req.user.role !== 'processor' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Processor access required' });
  }

  next();
};

/**
 * Middleware to check if user is a distributor
 */
exports.isDistributor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (req.user.role !== 'distributor' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Distributor access required' });
  }

  next();
};

/**
 * Middleware to check if user is a retailer
 */
exports.isRetailer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (req.user.role !== 'retailer' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Retailer access required' });
  }

  next();
};

/**
 * Middleware to check if user is a stakeholder (any supply chain role)
 */
exports.isStakeholder = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const stakeholderRoles = ['admin', 'farmer', 'processor', 'distributor', 'retailer'];
  
  if (!stakeholderRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Stakeholder access required' });
  }

  next();
};