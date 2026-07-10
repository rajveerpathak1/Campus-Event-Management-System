const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/* =====================================================
   SEND EMAIL
===================================================== */

// const sendEmail = async ({
//   to,
//   subject,
//   html,
// }) => {

//   return await resend.emails.send({

//     from: process.env.EMAIL_FROM,

//     to,

//     subject,

//     html,

//   });

// };

const sendEmail = async ({
  to,
  subject,
  html,
}) => {
  if (process.env.NODE_ENV === "test" || !process.env.RESEND_API_KEY) {
    console.log(`[Email Sim] To: ${to} | Subject: ${subject}`);
    return { id: "simulated-email-id" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to,
      subject,
      html,
    });

    if (error) {
      console.warn("Resend Email Warning:", error.message);
      return { error };
    }

    return data;
  } catch (err) {
    console.warn("Email Send Exception:", err.message);
    return null;
  }
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

/* =====================================================
   REGISTRATION EMAIL
===================================================== */

const sendRegistrationEmail = async ({
  to,
  name,
  eventTitle,
  eventDate,
}) => {
  const html = `
    <h2>Hello ${name},</h2>
    <p>You have successfully registered for <strong>${eventTitle}</strong> scheduled on ${new Date(eventDate).toUTCString()}.</p>
    <p>We look forward to seeing you there!</p>
  `;

  return sendEmail({
    to,
    subject: `Registration Confirmed: ${eventTitle}`,
    html,
  });
};

/* =====================================================
   UNREGISTER EMAIL
===================================================== */

const sendUnregisterEmail = async ({
  to,
  name,
  eventTitle,
}) => {
  const html = `
    <h2>Hello ${name},</h2>
    <p>You have been unregistered from <strong>${eventTitle}</strong>.</p>
  `;

  return sendEmail({
    to,
    subject: `Unregistered from ${eventTitle}`,
    html,
  });
};

module.exports = {

  sendEmail,

  sendVerificationEmail,

  sendPasswordResetEmail,

  sendRegistrationEmail,

  sendUnregisterEmail,

};