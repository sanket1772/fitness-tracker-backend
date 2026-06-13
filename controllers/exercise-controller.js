const { Cardio, Resistance } = require("../models");

module.exports = {
  async getAllExercises(req, res) {
    try {
      const userId = req.user._id;
      const cardio = await Cardio.find({ userId }).sort({ date: -1 });
      const resistance = await Resistance.find({ userId }).sort({ date: -1 });

      res.json({ cardio, resistance });
    } catch (err) {
      console.error(err);
      res.status(500).json(err);
    }
  },
};
