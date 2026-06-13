const router = require("express").Router();
const { body } = require("express-validator");
const {
  createUser,
  login,
  getSingleUser,
  getStats,
  getAdminUsers,
  deleteAdminUser,
} = require("../../controllers/user-controller");

// import middleware
const { authMiddleware } = require("../../utils/auth");

const usernameRegex = /^[A-Za-z]+$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const validateSignup = [
  body("username")
    .trim()
    .matches(usernameRegex)
    .withMessage("Username should contain only letters (a-z, A-Z)"),
  body("email")
    .trim()
    .matches(emailRegex)
    .withMessage("Invalid email address"),
  body("password")
    .matches(passwordRegex)
    .withMessage("Password should contain at least 8 characters, including at least one lowercase letter, one uppercase letter, one digit, and one special character"),
];

const validateLogin = [
  body("email").optional({ checkFalsy: true }).trim(),
  body("username").optional({ checkFalsy: true }).trim(),
  body("password").notEmpty().withMessage("Password is required"),
  body().custom((value) => {
    const identifier = String(value.email || value.username || "").trim();

    if (!identifier) {
      throw new Error("Username or email is required");
    }

    if (identifier.includes("@")) {
      if (!emailRegex.test(identifier)) {
        throw new Error("Invalid email address");
      }
      return true;
    }

    if (!usernameRegex.test(identifier)) {
      throw new Error("Username should contain only letters (a-z, A-Z)");
    }

    return true;
  }),
];

// put authMiddleware anywhere we need to send a token for verification of user
// /api/user for user signup
router.route("/").post(validateSignup, createUser);

// /api/user/login for user login
router.route("/login").post(validateLogin, login);

// /api/user/me to get single user data
router.route('/me').get(authMiddleware, getSingleUser);

// /api/user/stats to get user stats
router.route('/stats').get(authMiddleware, getStats);

// /api/user/admin/users for admin panel user management
router.route('/admin/users').get(authMiddleware, getAdminUsers);
router.route('/admin/users/:id').delete(authMiddleware, deleteAdminUser);

module.exports = router;
