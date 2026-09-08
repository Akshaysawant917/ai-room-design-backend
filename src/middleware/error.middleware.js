export function errorMiddleware(error, req, res, next) {
  console.error(error);
  const statusCode = error.statusCode || (error.name === 'MulterError' || error.code === 'LIMIT_FILE_SIZE' ? 400 : 500);
  const code = error.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : error.code || 'INTERNAL_ERROR';
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: statusCode < 500 ? error.message : 'Something went wrong.'
    }
  });
}

