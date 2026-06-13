const nodemailer = require('nodemailer');

const required = (name) => {
  if (!process.env[name]) {
    throw new Error(`Missing email configuration: ${name}`);
  }

  return process.env[name];
};

const getBooleanEnv = (name, defaultValue = false) => {
  const value = process.env[name];

  if (value === undefined || value === '') {
    return defaultValue;
  }

  return ['1', 'true', 'yes'].includes(value.toLowerCase());
};

const getFromAddress = () => {
  if (process.env.EMAIL_FROM) {
    return process.env.EMAIL_FROM;
  }

  const accountEmail = process.env.GMAIL_USER || process.env.SMTP_USER;

  return accountEmail ? `FitTrack App <${accountEmail}>` : 'FitTrack App';
};

const getTransportConfig = () => {
  if (process.env.SMTP_HOST) {
    const port = Number(required('SMTP_PORT'));

    if (!Number.isInteger(port) || port <= 0) {
      throw new Error('SMTP_PORT must be a valid port number.');
    }

    const options = {
      host: process.env.SMTP_HOST,
      port,
      secure: getBooleanEnv('SMTP_SECURE', port === 465),
    };

    if (process.env.SMTP_USER || process.env.SMTP_PASS) {
      options.auth = {
        user: required('SMTP_USER'),
        pass: required('SMTP_PASS'),
      };
    }

    return {
      provider: 'smtp',
      options,
    };
  }

  if (process.env.GMAIL_USER || process.env.GMAIL_APP_PASSWORD) {
    return {
      provider: 'gmail',
      options: {
        service: 'gmail',
        auth: {
          user: required('GMAIL_USER'),
          pass: required('GMAIL_APP_PASSWORD'),
        },
      },
    };
  }

  throw new Error(
    'Missing email provider configuration. Set GMAIL_USER and GMAIL_APP_PASSWORD for Gmail, or SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS for another provider.'
  );
};

const createEmailTransporter = () => {
  const config = getTransportConfig();

  return {
    config,
    transporter: nodemailer.createTransport(config.options),
  };
};

const getEmailConfigSummary = () => {
  const { config } = createEmailTransporter();

  return {
    provider: config.provider,
    service: config.options.service,
    host: config.options.host,
    port: config.options.port,
    secure: config.options.secure,
    authUser: config.options.auth?.user,
    from: getFromAddress(),
  };
};

const summarizeEmailError = (error) => ({
  message: error.message,
  code: error.code,
  command: error.command,
  responseCode: error.responseCode,
  response: error.response,
});

const verifyEmailTransport = async () => {
  const { transporter } = createEmailTransporter();

  return transporter.verify();
};

const sendWelcomeEmail = async (to, username) => {
  if (!to) {
    throw new Error('Recipient email is required for welcome email.');
  }

  const { config, transporter } = createEmailTransporter();
  const from = getFromAddress();

  const mailOptions = {
    from,
    to,
    subject: 'Welcome to FitTrack! \u26a1',
    text: `Hi ${username || 'there'}, successfully signed up! Get ready to crush your goals.`,
  };

  console.log('Sending welcome email:', {
    provider: config.provider,
    to,
    from,
  });

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', {
      response: info.response,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });
    return info;
  } catch (error) {
    console.error('Error sending email:', summarizeEmailError(error));
    throw error;
  }
};

module.exports = sendWelcomeEmail;
module.exports.createEmailTransporter = createEmailTransporter;
module.exports.getEmailConfigSummary = getEmailConfigSummary;
module.exports.verifyEmailTransport = verifyEmailTransport;
