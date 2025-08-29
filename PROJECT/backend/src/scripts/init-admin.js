/**
 * Initialize admin user script
 * This script creates an admin user if none exists
 */

const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const config = require('../config/config');

/**
 * Initialize admin user
 * @returns {Promise<void>}
 */
const initAdminUser = async () => {
  try {
    // Check if admin user exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists && config.adminEmail && config.adminPassword) {
      // Create admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(config.adminPassword, salt);
      
      const adminUser = new User({
        name: 'Admin User',
        email: config.adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error initializing admin user:', error.message);
  }
};

module.exports = initAdminUser;