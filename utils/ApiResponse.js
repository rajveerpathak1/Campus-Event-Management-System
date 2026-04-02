const ApiResponse = (res, { statusCode = 200, success = true, message, data, count }) => {
  const payload = {
    success,
    message,
    data,
  };

  if (typeof count !== "undefined") {
    payload.count = count;
  }

  return res.status(statusCode).json(payload);
};

module.exports = ApiResponse;

