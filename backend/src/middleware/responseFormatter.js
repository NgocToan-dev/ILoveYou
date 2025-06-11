/**
 * Response formatter middleware
 * Adds success and error methods to the response object
 */
const responseFormatter = (req, res, next) => {
  // Success response method
  res.success = (data = null, message = 'Success', statusCode = 200) => {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString(),
    };

    if (data !== null) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  };

  // Error response method
  res.error = (message = 'Internal Server Error', statusCode = 500, errors = null) => {
    const response = {
      success: false,
      error: {
        message,
        ...(errors && { errors }),
      },
      timestamp: new Date().toISOString(),
    };

    return res.status(statusCode).json(response);
  };

  // Paginated response method
  res.paginated = (data, pagination, message = 'Success') => {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total: pagination.total || 0,
        totalPages: Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
        hasNext: pagination.hasNext || false,
        hasPrev: pagination.hasPrev || false,
      },
      timestamp: new Date().toISOString(),
    });
  };

  next();
};

module.exports = responseFormatter;