const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth.middleware'); // Use your auth middleware

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Enhanced file filter
const fileFilter = (req, file, cb) => {
  console.log('📁 File received:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  // Check if file exists
  if (!file) {
    console.log('❌ No file provided');
    return cb(new Error('No file provided'), false);
  }

  // Check file type - be more permissive
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml'
  ];

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    console.log('✅ File type accepted:', file.mimetype, fileExtension);
    cb(null, true);
  } else {
    console.log('❌ File type rejected:', file.mimetype, fileExtension);
    cb(new Error(`Only image files are allowed! Received: ${file.mimetype}`), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1, // Only 1 file
  },
  fileFilter: fileFilter
});

// Upload image endpoint
router.post('/image', authenticate, (req, res) => {
  console.log('📤 Upload request received');
  console.log('🔑 User ID:', req.user?.id);
  console.log('📋 Headers:', req.headers);

  // Use multer middleware
  upload.single('image')(req, res, (err) => {
    try {
      if (err) {
        console.error('❌ Multer error:', err);
        
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'File too large. Maximum size is 10MB.'
            });
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
              success: false,
              message: 'Unexpected field name. Use "image" as field name.'
            });
          }
        }
        
        return res.status(400).json({
          success: false,
          message: err.message || 'Upload failed'
        });
      }

      console.log('📁 File processed:', req.file);

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided. Please select an image file.'
        });
      }

      // Construct full URL for the uploaded image
      const protocol = req.get('X-Forwarded-Proto') || req.protocol;
      const host = req.get('Host');
      const imageUrl = `${protocol}://${host}/backend/src/uploads/${req.file.filename}`;
      
      console.log('✅ Image uploaded successfully:', imageUrl);

      res.status(201).json({
        success: true,
        data: {
          url: imageUrl,
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        },
        message: 'Image uploaded successfully'
      });
    } catch (error) {
      console.error('❌ Upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Upload failed',
        error: error.message
      });
    }
  });
});

module.exports = router;
