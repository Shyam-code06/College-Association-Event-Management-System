const getPaginationParams = (query, defaultLimit = 10, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const requestedLimit = parseInt(query.limit, 10) || defaultLimit;
  const limit = Math.min(Math.max(1, requestedLimit), maxLimit);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

const buildPaginationMeta = (total, page, limit) => {
  const totalCount = parseInt(total, 10) || 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    page,
    limit,
    total: totalCount,
    totalPages
  };
};

module.exports = {
  getPaginationParams,
  buildPaginationMeta
};
