module.exports = ({
  name,
  verificationUrl,
}) => `
<!DOCTYPE html>
<html>

<body>

<h2>Welcome ${name} 👋</h2>

<p>

Thanks for registering with Campus Event Management.

</p>

<p>

Please verify your email.

</p>

<a href="${verificationUrl}">

Verify Email

</a>

<p>

This link expires in 24 hours.

</p>

</body>

</html>
`;