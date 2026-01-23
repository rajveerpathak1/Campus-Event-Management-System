module.exports = (err, req, res, next) => {
  const statusCode = err.status || 500;

  console.error({
    message: err.message,
    stack: err.stack,
    route: req.originalUrl,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};
