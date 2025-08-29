/**
 * Application configuration
 * Centralizes access to environment variables
 */
module.exports = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MongoDB configuration
  mongoURI: process.env.MONGODB_URI,
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: process.env.JWT_EXPIRATION || '24h',
  
  // Blockchain configuration
  web3Provider: process.env.WEB3_PROVIDER,
  contractAddress: process.env.CONTRACT_ADDRESS,
  infuraKey: process.env.INFURA_KEY,
  
  // Admin configuration
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  
  // Frontend URL for QR code verification
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // QR code base URL
  qrCodeBaseUrl: process.env.QR_CODE_BASE_URL || 'http://localhost:5000/qrcodes'
};