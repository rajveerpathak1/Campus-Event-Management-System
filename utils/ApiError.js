class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode; // keep compatibility with existing errorMiddleware
    this.details = details;
  }
}

module.exports = ApiError;

