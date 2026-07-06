module.exports = ({
  name,
  resetUrl,
}) => `
<!DOCTYPE html>
<html>

<body>

<h2>Hello ${name}</h2>

<p>

You requested a password reset.

</p>

<a href="${resetUrl}">

Reset Password

</a>

<p>

If this wasn't you, ignore this email.

</p>

<p>

The link expires in 15 minutes.

</p>

</body>

</html>
`;