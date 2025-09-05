const express = require('express');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts
} = require('../controllers/product.controller');
const { authenticate, checkOwnership } = require('../middleware/auth.middleware');
const { validateProduct, validatePagination, validateId } = require('../middleware/validation.middleware');

const router = express.Router();

// Public routes
router.get('/', validatePagination, getProducts);
router.get('/:id', validateId, getProductById);

// Protected routes
router.post('/', authenticate, validateProduct, createProduct);
router.get('/user/my-products', authenticate, validatePagination, getMyProducts);
router.put('/:id', authenticate, validateId, checkOwnership('product'), validateProduct, updateProduct);
router.delete('/:id', authenticate, validateId, checkOwnership('product'), deleteProduct);

module.exports = router;