const router = require("express").Router();
const userRoutes = require("./user-routes");
const exerciseRoutes = require("./exercise-routes");
const goalRoutes = require("./goal-routes");
const nutritionRoutes = require("./nutrition-routes");
const workoutsRoutes = require("./workouts-routes");
const { completeChallenge } = require("../../controllers/user-controller");

router.use("/user", userRoutes);
router.post("/complete-challenge", completeChallenge);
router.use("/exercise", exerciseRoutes);
router.use("/exercises", exerciseRoutes);
router.use("/goals", goalRoutes);
router.use("/nutrition", nutritionRoutes);
router.use("/workouts", workoutsRoutes);

module.exports = router;
