const express = require('express');
const {
  createSubPlan,
  getSubPlans,
  getSubPlanById,
  updateSubPlan,
  deleteSubPlan,
  getMySubPlans
} = require('../controllers/subplan.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validatePagination, validateId } = require('../middleware/validation.middleware');

const router = express.Router();

// Public routes
router.get('/', validatePagination, getSubPlans);
router.get('/:id', validateId, getSubPlanById);

// Protected routes
router.post('/', authenticate, createSubPlan);
router.get('/user/my-subplans', authenticate, validatePagination, getMySubPlans);
router.put('/:id', authenticate, validateId, updateSubPlan);
router.delete('/:id', authenticate, validateId, deleteSubPlan);

module.exports = router;