const express = require('express');
const {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  getMyCompanies
} = require('../controllers/company.controller');
const { authenticate, checkOwnership } = require('../middleware/auth.middleware');
const { validatePagination, validateId } = require('../middleware/validation.middleware');

const router = express.Router();

// Public routes
router.get('/', validatePagination, getCompanies);
router.get('/:id', validateId, getCompanyById);

// Protected routes
router.post('/', authenticate, createCompany);
router.get('/user/my-companies', authenticate, validatePagination, getMyCompanies);
router.put('/:id', authenticate, validateId, checkOwnership('company'), updateCompany);
router.delete('/:id', authenticate, validateId, checkOwnership('company'), deleteCompany);

module.exports = router;