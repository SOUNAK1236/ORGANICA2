const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure upload directories exist
const createDirectories = () => {
  const dirs = [
    path.join(__dirname, '../../public/uploads/products'),
    path.join(__dirname, '../../public/uploads/certifications'),
    path.join(__dirname, '../../public/uploads/users')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Create directories on module load
createDirectories();

// Storage configuration for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, '../../public/uploads');
    
    // Determine upload directory based on file type
    if (req.baseUrl.includes('/products')) {
      uploadPath = path.join(uploadPath, 'products');
    } else if (req.baseUrl.includes('/certifications')) {
      uploadPath = path.join(uploadPath, 'certifications');
    } else if (req.baseUrl.includes('/users')) {
      uploadPath = path.join(uploadPath, 'users');
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const fileExt = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${fileExt}`);
  }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const isValidType = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const isValidMimeType = allowedTypes.test(file.mimetype.split('/')[1]);
  
  if (isValidType && isValidMimeType) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Error handler for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

module.exports = {
  upload,
  handleUploadError
};