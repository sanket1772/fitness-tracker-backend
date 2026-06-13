const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new Schema({
  username: {
    type: String,
    trim: true,
    unique: true,
    required: "Username is Required",
    match: [/^[A-Za-z]+$/, "Username should contain only letters (a-z, A-Z)"],
  },
  password: {
    type: String,
    trim: true,
    required: "Password is Required",
    minlength: 8,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    required: "Email is Required",
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid email address"],
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  cardio: [{
    type: Schema.Types.ObjectId,
    ref: "Cardio"
  }],
  resistance: [{
    type: Schema.Types.ObjectId,
    ref: "Resistance"
  }],
  goals: [{
    type: Schema.Types.ObjectId,
    ref: "Goal"
  }],
  nutrition: [{
    type: Schema.Types.ObjectId,
    ref: "Nutrition"
  }],
  fitPoints: {
    type: Number,
    default: 0,
  },
  badges: {
    type: [String],
    default: [],
  },
  completedChallenges: {
    type: [String],
    default: [],
  }
});

// hash user password
UserSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("password")) {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }

  next();
});

// custom method to compare and validate password for logging in
UserSchema.methods.isCorrectPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = model("User", UserSchema);

module.exports = User;
