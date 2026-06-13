const { Resistance, User } = require("../models");
const { validationResult } = require('express-validator');
const { calculateCaloriesBurned } = require('../utils/calories');

module.exports = {
  // create Resistance
  createResistance(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const bodyWeight = Number(req.body.bodyWeight) || 70;
    calculateCaloriesBurned(req.body.type || 'resistance', req.body.duration, bodyWeight)
      .then((caloriesBurned) => {
        return Resistance.create({ ...req.body, caloriesBurned });
      })
      .then((dbResistanceData) => {
        return User.findOneAndUpdate(
          { _id: req.body.userId },
          { $push: { resistance: dbResistanceData._id } },
          { new: true }
        )
      })
      .then((dbUserData) => {
        if (!dbUserData) {
          return res.status(404).json({ message: "Resistance created but no user with this id!" });
        }
        res.json({ message: "Resistance successfully created!" });
      })
      .catch((err) => res.status(500).json(err));
  },

  // get one Resistance by id
  getResistanceById({ params }, res) {
    Resistance.findOne({ _id: params.id })
      .then((dbResistanceData) => {
        if (!dbResistanceData) {
          return res.status(404).json({ message: "No resistance data found with this id!" });
        }
        res.json(dbResistanceData);
      })
      .catch((err) => res.status(500).json(err));
  },

  // update resistance
  updateResistance(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    Resistance.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
      .then((dbResistanceData) => {
        if (!dbResistanceData) {
          return res.status(404).json({ message: "No resistance data found with this id!" });
        }
        res.json({ message: "Resistance successfully updated!" });
      })
      .catch((err) => res.status(500).json(err));
  },

  // delete resistance data
  async deleteResistance({ params }, res) {
    try {
      const dbResistanceData = await Resistance.findOneAndDelete({ _id: params.id });

      if (!dbResistanceData) {
        return res.status(404).json({ message: "No resistance data found with this id!" });
      }

      const dbUserData = await User.findOneAndUpdate(
        { resistance: params.id },
        { $pull: { resistance: params.id } },
        { new: true }
      );

      if (!dbUserData) {
        return res.status(404).json({ message: "Resistance deleted but no user with this id!" });
      }

      res.json({ message: "Resistance successfully deleted!" });
    } catch (err) {
      res.status(500).json(err);
    }
  },
};
