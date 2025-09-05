const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const userRoutes = require('./routes/user.routes');
const uploadRoutes = require('./routes/upload'); // Make sure this import is correct

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const { sendSuccess } = require('./utils/response.util');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || []
    : '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Serve static files - IMPORTANT: Must be before routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add debugging middleware to log all requests
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  sendSuccess(res, {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  }, 'Server is healthy');
});

// API routes - REGISTER ALL ROUTES HERE
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes); // ← ONLY ONE REGISTRATION

// API documentation endpoint
app.get('/api', (req, res) => {
  const apiInfo = {
    name: 'Mobile App Backend API',
    version: '1.0.0',
    description: 'REST API for mobile application with product catalog and user management',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'User login',
        'GET /api/auth/profile': 'Get user profile (protected)',
        'PUT /api/auth/profile': 'Update user profile (protected)'
      },
      products: {
        'GET /api/products': 'Get all products with filtering and pagination',
        'GET /api/products/:id': 'Get product by ID',
        'POST /api/products': 'Create new product (protected)',
        'PUT /api/products/:id': 'Update product (owner only)',
        'DELETE /api/products/:id': 'Delete product (owner only)',
        'GET /api/products/user/my-products': 'Get user\'s products (protected)'
      },
      categories: {
        'GET /api/categories': 'Get all categories',
        'GET /api/categories/:id': 'Get category by ID',
        'GET /api/categories/:id/products': 'Get products in category',
        'POST /api/categories': 'Create category (admin only)',
        'PUT /api/categories/:id': 'Update category (admin only)',
        'DELETE /api/categories/:id': 'Delete category (admin only)'
      },
      users: {
        'GET /api/users': 'Get all users (admin only)',
        'GET /api/users/:id': 'Get user by ID (owner/admin only)',
        'PUT /api/users/:id': 'Update user (owner/admin only)',
        'DELETE /api/users/:id': 'Delete user (admin only)',
        'GET /api/users/:id/products': 'Get user\'s products'
      },
      upload: {
        'POST /upload/image': 'Upload image file' // ← Add this to documentation
      }
    },
    authentication: 'Bearer token required for protected routes',
    rateLimit: '100 requests per 15 minutes per IP'
  };
  
  sendSuccess(res, apiInfo, 'API Documentation');
});

// 404 handler - MUST BE AFTER ALL ROUTES
app.use('*', notFoundHandler);

// Global error handler - MUST BE LAST
app.use(errorHandler);

module.exports = app;
