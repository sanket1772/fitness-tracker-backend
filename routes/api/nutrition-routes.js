const router = require("express").Router();
const { body } = require("express-validator");
const {
  createNutrition,
  getNutritionEntries,
  getNutritionById,
  updateNutrition,
  deleteNutrition,
} = require("../../controllers/nutrition-controller");
const { authMiddleware } = require("../../utils/auth");

const validateNutrition = [
  body("mealName").trim().isLength({ min: 1, max: 40 }).withMessage("Meal name must be 1-40 characters"),
  body("mealType").isIn(["breakfast", "lunch", "dinner", "snack"]).withMessage("Invalid meal type"),
  body("calories").isFloat({ min: 0 }).withMessage("Calories must be a positive number"),
  body("protein").isFloat({ min: 0 }).withMessage("Protein must be a positive number"),
  body("carbs").isFloat({ min: 0 }).withMessage("Carbs must be a positive number"),
  body("fat").isFloat({ min: 0 }).withMessage("Fat must be a positive number"),
  body("date").isISO8601().withMessage("Invalid date format"),
];

router.use(authMiddleware);

router.route("/").get(getNutritionEntries).post(validateNutrition, createNutrition);
router.route("/:id").get(getNutritionById).put(validateNutrition, updateNutrition).delete(deleteNutrition);

module.exports = router;
