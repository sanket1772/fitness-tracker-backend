const router = require("express").Router();
const { body, validationResult } = require('express-validator');
const {
  createResistance,
  getResistanceById,
  updateResistance,
  deleteResistance,
} = require("../../controllers/resistance-controller");

const {
  createCardio,
  getCardioById,
  updateCardio,
  deleteCardio,
} = require("../../controllers/cardio-controller");

const { getAllExercises } = require("../../controllers/exercise-controller");

// import middleware
const { authMiddleware } = require('../../utils/auth');

// on insominia: 
// choose Auth bearer, add response-body attribute and edit tag
// change request to the login api
// change filter to $. to find token
router.use(authMiddleware);

// Validation middleware for cardio
const validateCardio = [
  body('name').isLength({ min: 1, max: 30 }).withMessage('Name must be 1-30 characters'),
  body('distance').isFloat({ min: 0 }).withMessage('Distance must be a positive number'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('userId').isMongoId().withMessage('Invalid user ID'),
];

// Validation middleware for resistance
const validateResistance = [
  body('name').isLength({ min: 1, max: 30 }).withMessage('Name must be 1-30 characters'),
  body('weight').isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
  body('sets').isInt({ min: 1 }).withMessage('Sets must be a positive integer'),
  body('reps').isInt({ min: 1 }).withMessage('Reps must be a positive integer'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('userId').isMongoId().withMessage('Invalid user ID'),
];

// /api/exercise
router.route("/").get(getAllExercises);

// /api/exercise/cardio
router.route("/cardio").post(validateCardio, createCardio);

// /api/exercise/cardio/:id
router.route("/cardio/:id").get(getCardioById).put(validateCardio, updateCardio).delete(deleteCardio);

// /api/exercise/resistance
router.route("/resistance").post(validateResistance, createResistance);

// /api/exercise/resistance/:id
router.route("/resistance/:id").get(getResistanceById).put(validateResistance, updateResistance).delete(deleteResistance);

module.exports = router;
