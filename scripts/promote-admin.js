const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const db = require("../config/connection");
const { User } = require("../models");

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Usage: npm run make-admin -- user@example.com");
  process.exit(1);
}

db.once("open", async () => {
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { isAdmin: true } },
      { new: true }
    ).select("username email isAdmin");

    if (!user) {
      console.error(`No user found with email: ${email}`);
      process.exitCode = 1;
      return;
    }

    console.log(`${user.username} (${user.email}) is now an admin.`);
    console.log("Log out and log back in so the browser gets a fresh admin token.");
  } catch (err) {
    console.error("Unable to promote admin:", err);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
});
