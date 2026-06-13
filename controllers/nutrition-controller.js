const { Nutrition, User } = require("../models");
const { validationResult } = require("express-validator");

module.exports = {
  async createNutrition(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({ message: "Cannot find a user with this id." });
      }

      const nutrition = await Nutrition.create({
        ...req.body,
        userId: req.user._id,
      });

      await User.findByIdAndUpdate(
        req.user._id,
        { $push: { nutrition: nutrition._id } },
        { new: true }
      );

      res.status(201).json({
        message: "Nutrition entry successfully created!",
        nutrition,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to create nutrition entry." });
    }
  },

  async getNutritionEntries(req, res) {
    try {
      const nutrition = await Nutrition.find({ userId: req.user._id }).sort({ date: -1, createdAt: -1 });
      res.json(nutrition);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to load nutrition entries." });
    }
  },

  async getNutritionById(req, res) {
    try {
      const nutrition = await Nutrition.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });

      if (!nutrition) {
        return res.status(404).json({ message: "No nutrition entry found with this id." });
      }

      res.json(nutrition);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to load nutrition entry." });
    }
  },

  async updateNutrition(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const nutrition = await Nutrition.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        req.body,
        { new: true, runValidators: true }
      );

      if (!nutrition) {
        return res.status(404).json({ message: "No nutrition entry found with this id." });
      }

      res.json({
        message: "Nutrition entry successfully updated!",
        nutrition,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to update nutrition entry." });
    }
  },

  async deleteNutrition(req, res) {
    try {
      const nutrition = await Nutrition.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id,
      });

      if (!nutrition) {
        return res.status(404).json({ message: "No nutrition entry found with this id." });
      }

      await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { nutrition: req.params.id } },
        { new: true }
      );

      res.json({ message: "Nutrition entry successfully deleted!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to delete nutrition entry." });
    }
  },
};
