const QRCode = require('qrcode');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

/**
 * Utility functions for QR code generation and verification
 */

/**
 * Generate a unique hash for a QR code
 * @param {String} productId - Product ID
 * @param {String} timestamp - Timestamp
 * @returns {String} - Unique hash
 */
exports.generateHash = (productId, timestamp = Date.now()) => {
  const data = `${productId}-${timestamp}-${Math.random()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate a QR code image and save it to the file system
 * @param {String} hash - QR code hash
 * @param {String} productId - Product ID
 * @returns {Promise<Object>} - QR code data
 */
exports.generateQRCode = async (hash, productId) => {
  try {
    // Create directory if it doesn't exist
    const qrDirectory = path.join(__dirname, '../../public/qrcodes');
    if (!fs.existsSync(qrDirectory)) {
      fs.mkdirSync(qrDirectory, { recursive: true });
    }

    // QR code data
    const verificationUrl = `${config.frontendUrl}/verify/${hash}`;
    
    // Generate QR code image
    const qrImagePath = path.join(qrDirectory, `${hash}.png`);
    await QRCode.toFile(qrImagePath, verificationUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    // Return QR code data
    return {
      hash,
      productId,
      imageUrl: `/qrcodes/${hash}.png`,
      verificationUrl
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

/**
 * Validate a QR code hash
 * @param {String} hash - QR code hash to validate
 * @returns {Boolean} - Whether the hash is valid
 */
exports.validateHash = (hash) => {
  // Check if hash is a valid SHA-256 hash (64 hex characters)
  const hashRegex = /^[a-f0-9]{64}$/i;
  return hashRegex.test(hash);
};