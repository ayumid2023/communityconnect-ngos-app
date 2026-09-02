/**
 * Success response helper
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Error response helper
 */
const errorResponse = (res, error, message = 'Error', statusCode = 500) => {
  const response = {
    success: false,
    message,
    error: error.message || error,
  };
  
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Paginated response helper
 */
const paginatedResponse = (res, data, page, limit, total, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
};

/**
 * Validation error helper
 */
const validationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation Error',
    errors,
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  validationError,
};
