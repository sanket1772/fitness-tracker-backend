const { Schema, model } = require("mongoose");

const GoalSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['cardio', 'resistance']
    },
    target: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
      enum: ['miles', 'lbs', 'minutes']
    },
    deadline: {
      type: Date,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  }
);

const Goal = model("Goal", GoalSchema);

module.exports = Goal;