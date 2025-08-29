const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @route   GET api/users
 * @desc    Get all users
 * @access  Private - Admin only
 */
router.get('/', authMiddleware.authenticate, authMiddleware.isAdmin, userController.getUsers);

/**
 * @route   GET api/users/:id
 * @desc    Get user by ID
 * @access  Private - Admin or Self
 */
router.get('/:id', authMiddleware.authenticate, userController.getUserById);

/**
 * @route   PUT api/users/:id
 * @desc    Update user
 * @access  Private - Admin or Self
 */
router.put(
  '/:id',
  [
    authMiddleware.authenticate,
    check('name', 'Name is required').optional().not().isEmpty(),
    check('email', 'Please include a valid email').optional().isEmail(),
    check('role', 'Role is required').optional()
  ],
  userController.updateUser
);

/**
 * @route   PUT api/users/:id/password
 * @desc    Change password
 * @access  Private - Self only
 */
router.put(
  '/:id/password',
  [
    authMiddleware.authenticate,
    check('currentPassword', 'Current password is required').exists(),
    check('newPassword', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  userController.changePassword
);

/**
 * @route   DELETE api/users/:id
 * @desc    Delete user
 * @access  Private - Admin only
 */
router.delete('/:id', authMiddleware.authenticate, authMiddleware.isAdmin, userController.deleteUser);

/**
 * @route   GET api/users/role/:role
 * @desc    Get users by role
 * @access  Private - Admin only
 */
router.get('/role/:role', authMiddleware.authenticate, authMiddleware.isAdmin, userController.getUsersByRole);

module.exports = router;