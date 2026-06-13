const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/fitness-tracker";

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log(`Connected to MongoDB at ${mongoUri}`);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

module.exports = mongoose.connection;
