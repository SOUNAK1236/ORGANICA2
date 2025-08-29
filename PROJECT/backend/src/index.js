const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { upload, handleUploadError } = require('./utils/upload');
const connectDB = require('./config/database');
const config = require('./config/config');
const responseUtil = require('./utils/response');
const initAdminUser = require('./scripts/init-admin');
const setupSwagger = require('./utils/swagger');
require('dotenv').config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Setup Swagger documentation
setupSwagger(app);

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const batchRoutes = require('./routes/batch.routes');
const certificationRoutes = require('./routes/certification.routes');
const qrcodeRoutes = require('./routes/qrcode.routes');

// Define routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/qrcodes', qrcodeRoutes);

// Default route
app.get('/', (req, res) => {
  responseUtil.success(res, 'Welcome to Organic Food Traceability API');
});

// 404 handler
app.use((req, res) => {
  responseUtil.notFound(res, `Route ${req.originalUrl} not found`);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  responseUtil.error(res, 'Something went wrong!', 500, err);
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize admin user
    await initAdminUser();
    
    // Start server
    app.listen(config.port, () => {
      console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
      console.log('API Documentation: http://localhost:' + config.port + '/api-docs');
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app; // For testing purposes