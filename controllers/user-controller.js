const { User, Cardio, Resistance, Goal, Nutrition } = require("../models");
const { signToken } = require("../utils/auth");
const sendWelcomeEmail = require("../utils/email");
const { Types } = require("mongoose");
const { validationResult } = require("express-validator");

const getAdminEmails = () => {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

const isAdminUser = (user) => {
  return Boolean(user?.isAdmin || getAdminEmails().includes(user?.email?.toLowerCase()));
};

module.exports = {
  // get a single user by id or username
  async getSingleUser(req, res) {
    const foundUser = await User.findOne({
      $or: [{ _id: req.user._id }, { username: req.params.username }],
    })
      .select("-password -__v")
      .populate("cardio")
      .populate("resistance")
      .populate("nutrition")

    if (!foundUser) {
      return res.status(400).json({ message: 'Cannot find a user with this id!' });
    }

    res.json(foundUser);
  },

  async getAdminUsers(req, res) {
    try {
      const requestingUser = await User.findById(req.user._id);

      if (!isAdminUser(requestingUser)) {
        return res.status(403).json({ message: "Admin access required." });
      }

      const users = await User.find({})
        .select("-password -__v")
        .lean();

      const userIds = users.map((user) => user._id);

      const [cardioCounts, resistanceCounts, goalCounts, nutritionCounts] = await Promise.all([
        Cardio.aggregate([
          { $match: { userId: { $in: userIds } } },
          { $group: { _id: "$userId", count: { $sum: 1 }, lastActivity: { $max: "$date" } } },
        ]),
        Resistance.aggregate([
          { $match: { userId: { $in: userIds } } },
          { $group: { _id: "$userId", count: { $sum: 1 }, lastActivity: { $max: "$date" } } },
        ]),
        Goal.aggregate([
          { $match: { userId: { $in: userIds } } },
          { $group: { _id: "$userId", count: { $sum: 1 } } },
        ]),
        Nutrition.aggregate([
          { $match: { userId: { $in: userIds } } },
          { $group: { _id: "$userId", count: { $sum: 1 }, lastNutrition: { $max: "$date" } } },
        ]),
      ]);

      const countsByUser = new Map();

      const addCounts = (items, key) => {
        items.forEach((item) => {
          const userId = item._id.toString();
          const current = countsByUser.get(userId) || {};
          current[key] = item.count;
          if (item.lastActivity) {
            current.lastActivity = current.lastActivity
              ? new Date(Math.max(new Date(current.lastActivity), new Date(item.lastActivity)))
              : item.lastActivity;
          }
          countsByUser.set(userId, current);
        });
      };

      addCounts(cardioCounts, "cardioCount");
      addCounts(resistanceCounts, "resistanceCount");
      addCounts(goalCounts, "goalCount");
      addCounts(nutritionCounts, "nutritionCount");

      res.json(users.map((user) => {
        const counts = countsByUser.get(user._id.toString()) || {};
        return {
          ...user,
          isAdmin: isAdminUser(user),
          cardioCount: counts.cardioCount || 0,
          resistanceCount: counts.resistanceCount || 0,
          goalCount: counts.goalCount || 0,
          nutritionCount: counts.nutritionCount || 0,
          totalActivities: (counts.cardioCount || 0) + (counts.resistanceCount || 0),
          lastActivity: counts.lastActivity || null,
        };
      }));
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to load admin users." });
    }
  },

  async deleteAdminUser(req, res) {
    try {
      const requestingUser = await User.findById(req.user._id);

      if (!isAdminUser(requestingUser)) {
        return res.status(403).json({ message: "Admin access required." });
      }

      if (req.params.id === req.user._id) {
        return res.status(400).json({ message: "Admins cannot delete their own account." });
      }

      const deletedUser = await User.findByIdAndDelete(req.params.id);

      if (!deletedUser) {
        return res.status(404).json({ message: "User not found." });
      }

      await Promise.all([
        Cardio.deleteMany({ userId: req.params.id }),
        Resistance.deleteMany({ userId: req.params.id }),
        Goal.deleteMany({ userId: req.params.id }),
        Nutrition.deleteMany({ userId: req.params.id }),
      ]);

      res.json({ message: "User and activity data deleted." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to delete user." });
    }
  },

  // get user stats
  async getStats(req, res) {
    try {
      const cardioStats = await Cardio.aggregate([
        { $match: { userId: req.user._id } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, totalDistance: { $sum: "$distance" } } },
        { $sort: { "_id": 1 } }
      ]);

      const resistanceStats = await Resistance.aggregate([
        { $match: { userId: req.user._id } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, totalWeight: { $sum: { $multiply: ["$weight", "$sets", "$reps"] } } } },
        { $sort: { "_id": 1 } }
      ]);

      const totalCardioDistance = await Cardio.aggregate([
        { $match: { userId: req.user._id } },
        { $group: { _id: null, total: { $sum: "$distance" } } }
      ]);

      const totalResistanceWeight = await Resistance.aggregate([
        { $match: { userId: req.user._id } },
        { $group: { _id: null, total: { $sum: { $multiply: ["$weight", "$sets", "$reps"] } } } }
      ]);

      res.json({
        cardioDates: cardioStats.map(s => s._id),
        cardioDistances: cardioStats.map(s => s.totalDistance),
        resistanceDates: resistanceStats.map(s => s._id),
        resistanceWeights: resistanceStats.map(s => s.totalWeight),
        totalCardioDistance: totalCardioDistance[0]?.total || 0,
        totalResistanceWeight: totalResistanceWeight[0]?.total || 0,
      });
    } catch (err) {
      res.status(500).json(err);
    }
  },

  async completeChallenge(req, res) {
    try {
      const {
        userId,
        challengeId = "weekly-mobility-routine",
        badgeName = "Flexible Flyer",
        points = 10,
      } = req.body;

      if (!userId || !Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "A valid userId is required." });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "Cannot find a user with this id." });
      }

      const alreadyCompleted = user.completedChallenges.includes(challengeId);

      if (!alreadyCompleted) {
        user.completedChallenges.push(challengeId);

        if (!user.badges.includes(badgeName)) {
          user.badges.push(badgeName);
        }

        user.fitPoints += Number(points) || 0;
        await user.save();
      }

      res.json({
        message: alreadyCompleted
          ? "Challenge already completed. Your badge is already on your profile."
          : "Challenge completed. Badge earned.",
        badgeName,
        fitPoints: user.fitPoints,
        badges: user.badges,
        completedChallenges: user.completedChallenges,
        alreadyCompleted,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to complete challenge." });
    }
  },

  // create a user, sign a token, and send it back to sign up page
  async createUser(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    try {
      const { username, email, password } = req.body;
      const normalizedEmail = email.trim().toLowerCase();
      const adminEmails = getAdminEmails();
      const userCount = await User.countDocuments();
      const user = await User.create({
        username: username.trim(),
        email: normalizedEmail,
        password,
        isAdmin: userCount === 0 || adminEmails.includes(normalizedEmail),
      });

      if (!user) {
        return res.status(400).json({ message: "Something is wrong!" });
      }

      const token = signToken(user);
      const safeUser = user.toObject();
      delete safeUser.password;

      try {
        await sendWelcomeEmail(user.email, user.username);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }

      res.json({ token, user: safeUser });
    } catch (err) {
      console.error(err);
      if (err.code === 11000) {
        return res.status(400).json({ message: "Username or email already exists" });
      }
      return res.status(400).json({ message: err.message || "Unable to create user" });
    }
  },

  // login a user, sign a token, and send it back to login page
  async login(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    try {
      const identifier = String(req.body.email || req.body.username || "").trim();
      const password = req.body.password;
      const query = identifier.includes("@")
        ? { email: identifier.toLowerCase() }
        : { username: identifier };
      const user = await User.findOne(query);

      if (!user) {
        return res.status(400).json({ message: "Invalid username/email or password" });
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        return res.status(400).json({ message: "Invalid username/email or password" });
      }
      if (!user.isAdmin && isAdminUser(user)) {
        user.isAdmin = true;
        await user.save();
      }

      const token = signToken(user);
      const safeUser = user.toObject();
      delete safeUser.password;
      res.json({ token, user: safeUser });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message || "Unable to login" });
    }
  },
};
