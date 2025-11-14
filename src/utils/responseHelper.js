/**
 * Standardized response helper for API
 */

const sendSuccess = (res, data = {}, message = "Success", status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, message = "Something went wrong", status = 500, error = null) => {
  const response = {
    success: false,
    message,
  };

  if (error) {
    response.error = error;
  }

  return res.status(status).json(response);
};

export default {
  sendSuccess,
  sendError,
};