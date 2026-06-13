const { Cardio, User } = require("../models");
const { validationResult } = require('express-validator');
const { calculateCaloriesBurned } = require('../utils/calories');

module.exports = {
  // create cardio
  createCardio(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const bodyWeight = Number(req.body.bodyWeight) || 70;
    calculateCaloriesBurned(req.body.type || 'cardio', req.body.duration, bodyWeight)
      .then((caloriesBurned) => {
        return Cardio.create({ ...req.body, caloriesBurned });
      })
      .then((dbCardioData) => {
        return User.findOneAndUpdate(
          { _id: req.body.userId },
          { $push: { cardio: dbCardioData._id } },
          { new: true }
        )
      })
      .then((dbUserData) => {
        if (!dbUserData) {
          return res.status(404).json({ message: "Cardio created but no user with this id!" });
        }
        res.json({ message: "Cardio successfully created!" });
      })
      .catch((err) => res.status(500).json(err));
  },

  // get one Cardio by id
  getCardioById({ params }, res) {
    Cardio.findOne({ _id: params.id })
      .then((dbCardioData) => {
        if (!dbCardioData) {
          return res.status(404).json({ message: "No cardio data found with this id!" });
        }
        res.json(dbCardioData);
      })
      .catch((err) => res.status(500).json(err));
  },

  // update cardio
  updateCardio(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    Cardio.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
      .then((dbCardioData) => {
        if (!dbCardioData) {
          return res.status(404).json({ message: "No cardio data found with this id!" });
        }
        res.json({ message: "Cardio successfully updated!" });
      })
      .catch((err) => res.status(500).json(err));
  },

  // delete cardio data
  async deleteCardio({ params }, res) {
    try {
      const dbCardioData = await Cardio.findOneAndDelete({ _id: params.id });

      if (!dbCardioData) {
        return res.status(404).json({ message: "No cardio data found with this id!" });
      }

      const dbUserData = await User.findOneAndUpdate(
        { cardio: params.id },
        { $pull: { cardio: params.id } },
        { new: true }
      );

      if (!dbUserData) {
        return res.status(404).json({ message: "Cardio deleted but no user with this id!" });
      }

      res.json({ message: "Cardio successfully deleted!" });
    } catch (err) {
      res.status(500).json(err);
    }
  },
};
