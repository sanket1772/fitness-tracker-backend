const { Cardio, Resistance } = require("../models");
const mongoose = require("mongoose");

module.exports = {
  async getMonthlyCalories(req, res) {
    try {
      const { userId } = req.params;

      // Validate userId format
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid user ID format" });
      }

      const objectId = new mongoose.Types.ObjectId(userId);

      // Aggregate cardio calories by month
      const cardioData = await Cardio.aggregate([
        { $match: { userId: objectId } },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" }
            },
            cardioCalories: { $sum: "$caloriesBurned" }
          }
        }
      ]);

      // Aggregate resistance calories by month
      const resistanceData = await Resistance.aggregate([
        { $match: { userId: objectId } },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" }
            },
            resistanceCalories: { $sum: "$caloriesBurned" }
          }
        }
      ]);

      // Merge the two datasets by month/year
      const monthlyMap = {};
      
      cardioData.forEach((item) => {
        const key = `${item._id.year}-${item._id.month}`;
        monthlyMap[key] = {
          year: item._id.year,
          month: item._id.month,
          cardioCalories: item.cardioCalories,
          resistanceCalories: 0
        };
      });

      resistanceData.forEach((item) => {
        const key = `${item._id.year}-${item._id.month}`;
        if (monthlyMap[key]) {
          monthlyMap[key].resistanceCalories = item.resistanceCalories;
        } else {
          monthlyMap[key] = {
            year: item._id.year,
            month: item._id.month,
            cardioCalories: 0,
            resistanceCalories: item.resistanceCalories
          };
        }
      });

      // Convert to sorted array
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedData = Object.values(monthlyMap)
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.month - b.month;
        })
        .map((item) => ({
          month: `${monthNames[item.month - 1]} ${item.year}`,
          cardio: item.cardioCalories,
          resistance: item.resistanceCalories
        }));

      res.status(200).json(formattedData);
    } catch (error) {
      console.error("Error aggregating monthly data:", error);
      res.status(500).json({ error: "Failed to fetch monthly calorie data" });
    }
  }
};
