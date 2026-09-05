export const sendSuccess = (res, statusCode, message, data = null) => {
  res.status(statusCode).json({
    success: true,
    message,
    ...(data && { data })
  });
};

export const sendError = (res, statusCode, message, errorDetails) => {
  res.status(statusCode).json({
    success: false,
    message,
    error: errorDetails
  });
};
