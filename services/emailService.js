const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendRegistrationEmail = async ({
  to,
  name,
  eventTitle,
  eventDate,
}) => {
  await transporter.sendMail({
    from: `"CampusEvents" <${process.env.EMAIL_USER}>`,

    to,

    subject: `Registration Confirmed - ${eventTitle}`,

    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Hello ${name},</h2>

        <p>
          You have successfully registered for
          <strong>${eventTitle}</strong>.
        </p>

        <p>
          <strong>Event Date:</strong>
          ${new Date(eventDate).toDateString()}
        </p>

        <br/>

        <p>
          See you there 🚀
        </p>

        <p>
          Campus Event Management System
        </p>
      </div>
    `,
  });
};

const sendUnregisterEmail = async ({
  to,
  name,
  eventTitle,
}) => {
  await transporter.sendMail({
    from: `"CampusEvents" <${process.env.EMAIL_USER}>`,

    to,

    subject: `Registration Cancelled - ${eventTitle}`,

    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Hello ${name},</h2>

        <p>
          Your registration for
          <strong>${eventTitle}</strong>
          has been cancelled.
        </p>

        <br/>

        <p>
          Campus Event Management System
        </p>
      </div>
    `,
  });
};

module.exports = {
  sendRegistrationEmail,
  sendUnregisterEmail,
};