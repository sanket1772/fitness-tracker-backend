const router = require("express").Router();
const { getMonthlyCalories } = require("../../controllers/workouts-controller");
const { authMiddleware } = require("../../utils/auth");

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/workouts/monthly-calories/:userId
router.route("/monthly-calories/:userId").get(getMonthlyCalories);

module.exports = router;
