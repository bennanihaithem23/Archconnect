const express = require('express');
const {
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  getMyPlans
} = require('../controllers/plan.controller');
const { authenticate, checkOwnership } = require('../middleware/auth.middleware');
const { validatePagination, validateId } = require('../middleware/validation.middleware');

const router = express.Router();

// Public routes
router.get('/', validatePagination, getPlans);
router.get('/:id', validateId, getPlanById);

// Protected routes
router.post('/', authenticate, createPlan);
router.get('/user/my-plans', authenticate, validatePagination, getMyPlans);
router.put('/:id', authenticate, validateId, checkOwnership('plan'), updatePlan);
router.delete('/:id', authenticate, validateId, checkOwnership('plan'), deletePlan);

module.exports = router;