const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!allowedRoles.includes(req.session.user.role)) {
      return res.status(403).json({
        message: "Access denied",
        role: req.session.user.role
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
