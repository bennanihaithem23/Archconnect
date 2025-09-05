const express = require('express');
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryProducts
} = require('../controllers/category.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validateCategory, validatePagination, validateId } = require('../middleware/validation.middleware');

const router = express.Router();

// Public routes
router.get('/', validatePagination, getCategories);
router.get('/:id', validateId, getCategoryById);
router.get('/:id/products', validateId, validatePagination, getCategoryProducts);

// Admin only routes
router.post('/', authenticate, authorize('ADMIN'), validateCategory, createCategory);
router.put('/:id', authenticate, authorize('ADMIN'), validateId, validateCategory, updateCategory);
router.delete('/:id', authenticate, authorize('ADMIN'), validateId, deleteCategory);

module.exports = router;