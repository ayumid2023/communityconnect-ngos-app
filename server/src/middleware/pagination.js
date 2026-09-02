const paginationMiddleware = (defaultLimit = 20, maxLimit = 100) => {
  return (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(
      parseInt(req.query.limit) || defaultLimit,
      maxLimit
    );
    const skip = (page - 1) * limit;

    req.pagination = {
      page,
      limit,
      skip,
    };

    // Store the original json method
    const originalJson = res.json;

    // Override json method to add pagination metadata
    res.json = function(data) {
      if (data && typeof data === 'object' && !data.pagination) {
        const total = data.total || data.length || 0;
        const responseData = data.data || data;
        
        return originalJson.call(this, {
          success: true,
          data: responseData,
          pagination: {
            page: req.pagination.page,
            limit: req.pagination.limit,
            total: total,
            pages: Math.ceil(total / req.pagination.limit),
          },
        });
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = paginationMiddleware;
