const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/* =====================================================
   SEND EMAIL
===================================================== */

const sendEmail = async ({
  to,
  subject,
  html,
}) => {

  return await resend.emails.send({

    from: process.env.EMAIL_FROM,

    to,

    subject,

    html,

  });

};

/* =====================================================
   VERIFY EMAIL
===================================================== */

const sendVerificationEmail = async ({
  email,
  name,
  verificationUrl,
}) => {

  const html = require("../templates/verifyEmail")({

    name,

    verificationUrl,

  });

  return sendEmail({

    to: email,

    subject: "Verify your email",

    html,

  });

};

/* =====================================================
   PASSWORD RESET
===================================================== */

const sendPasswordResetEmail = async ({
  email,
  name,
  resetUrl,
}) => {

  const html = require("../templates/resetPassword")({

    name,

    resetUrl,

  });

  return sendEmail({

    to: email,

    subject: "Reset your password",

    html,

  });

};

module.exports = {

  sendEmail,

  sendVerificationEmail,

  sendPasswordResetEmail,

};