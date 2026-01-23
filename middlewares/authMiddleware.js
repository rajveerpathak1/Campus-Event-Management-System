module.exports = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  // attach user to request for easy access
  req.user = req.session.user;
  next();
};
