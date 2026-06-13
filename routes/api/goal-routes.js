const router = require("express").Router();
const { body, validationResult } = require('express-validator');
const {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
} = require("../../controllers/goal-controller");

// import middleware
const { authMiddleware } = require('../../utils/auth');

// Validation middleware for goal
const validateGoal = [
  body('type').isIn(['cardio', 'resistance']).withMessage('Type must be cardio or resistance'),
  body('target').isFloat({ min: 0 }).withMessage('Target must be a positive number'),
  body('unit').isIn(['miles', 'lbs', 'minutes']).withMessage('Invalid unit'),
  body('deadline').isISO8601().withMessage('Invalid deadline date'),
  body('userId').isMongoId().withMessage('Invalid user ID'),
];

router.use(authMiddleware);

// /api/goal
router.route("/").get(getGoals).post(validateGoal, createGoal);

// /api/goal/:id
router.route("/:id").put(validateGoal, updateGoal).delete(deleteGoal);

module.exports = router;