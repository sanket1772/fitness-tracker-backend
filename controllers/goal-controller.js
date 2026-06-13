const { Goal, User } = require("../models");
const { validationResult } = require('express-validator');

module.exports = {
  // create goal
  createGoal(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    Goal.create(req.body)
      .then((dbGoalData) => {
        return User.findOneAndUpdate(
          { _id: req.body.userId },
          { $push: { goals: dbGoalData._id } },
          { new: true }
        )
      })
      .then((dbUserData) => {
        if (!dbUserData) {
          return res.status(404).json({ message: "Goal created but no user with this id!" });
        }
        res.json({ message: "Goal successfully created!" });
      })
      .catch((err) => res.status(500).json(err));
  },

  // get goals by user
  getGoals({ user }, res) {
    Goal.find({ userId: user._id })
      .then((dbGoalData) => res.json(dbGoalData))
      .catch((err) => res.status(500).json(err));
  },

  // update goal
  updateGoal(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    Goal.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
      .then((dbGoalData) => {
        if (!dbGoalData) {
          return res.status(404).json({ message: "No goal data found with this id!" });
        }
        res.json({ message: "Goal successfully updated!" });
      })
      .catch((err) => res.status(500).json(err));
  },

  // delete goal
  deleteGoal({ params }, res) {
    Goal.findOneAndDelete({ _id: params.id })
      .then((dbGoalData) => {
        if (!dbGoalData) {
          res.status(404).json({ message: "No goal data found with this id!" })
        }
        return User.findOneAndUpdate(
          { goals: params.id },
          { $pull: { goals: params.id } },
          { new: true }
        )
      })
      .then((dbUserData) => {
        if (!dbUserData) {
          return res.status(404).json({ message: "Goal deleted but no user found!" });
        }
        res.json({ message: "Goal successfully deleted!" });
      })
      .catch((err) => res.status(500).json(err));
  },
};