import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { HttpError } from 'http-errors';

export function errorHandler(
  err: Error | HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = 'statusCode' in err ? err.statusCode : 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  if (statusCode >= 500) {
    logger.error({ err, stack: err.stack }, 'Unhandled error');
  } else {
    logger.warn({ statusCode, message }, 'Client error');
  }

  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && statusCode >= 500
        ? { stack: err.stack }
        : {}),
    },
  });
}
