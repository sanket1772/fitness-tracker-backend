const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const sendWelcomeEmail = require("../utils/email");

const to = process.argv[2]?.trim();
const username = process.argv.slice(3).join(" ").trim() || "Test User";

const summarizeEmailError = (error) => ({
  message: error.message,
  code: error.code,
  command: error.command,
  responseCode: error.responseCode,
  response: error.response,
});

if (!to) {
  console.error("Usage: npm run test-email -- recipient@example.com [Recipient Name]");
  process.exit(1);
}

(async () => {
  try {
    console.log("Email config:", sendWelcomeEmail.getEmailConfigSummary());
    console.log("Verifying email transport...");
    await sendWelcomeEmail.verifyEmailTransport();

    console.log("Transport verified. Sending test welcome email...");
    const info = await sendWelcomeEmail(to, username);

    console.log("Email send result:", {
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Email test failed:", summarizeEmailError(error));
    process.exit(1);
  }
})();
