const { Schema, model } = require("mongoose");

const NutritionSchema = new Schema(
  {
    mealName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    mealType: {
      type: String,
      required: true,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      default: "breakfast",
    },
    calories: {
      type: Number,
      required: true,
      min: 0,
    },
    protein: {
      type: Number,
      default: 0,
      min: 0,
    },
    carbs: {
      type: Number,
      default: 0,
      min: 0,
    },
    fat: {
      type: Number,
      default: 0,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Nutrition = model("Nutrition", NutritionSchema);

module.exports = Nutrition;
