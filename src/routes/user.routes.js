const express = require('express');
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserProducts
} = require('../controllers/user.controller');
const { authenticate, authorize, checkOwnership } = require('../middleware/auth.middleware');
const { validatePagination, validateId } = require('../middleware/validation.middleware');

const router = express.Router();

// Admin only routes
router.get('/', authenticate, authorize('ADMIN'), validatePagination, getUsers);
router.delete('/:id', authenticate, authorize('ADMIN'), validateId, deleteUser);

// Protected routes (user can access own data, admin can access all)
router.get('/:id', authenticate, validateId, checkOwnership('user'), getUserById);
router.put('/:id', authenticate, validateId, checkOwnership('user'), updateUser);
router.get('/:id/products', authenticate, validateId, validatePagination, getUserProducts);

module.exports = router;