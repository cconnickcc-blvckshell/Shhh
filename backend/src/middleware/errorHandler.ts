import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { HttpError } from 'http-errors';
import { InitiationCapReachedError } from '../utils/errors';

export function errorHandler(
  err: Error | HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof InitiationCapReachedError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        cap: err.cap,
        used: err.used,
        tierOptions: err.tierOptions,
      },
    });
  }

  const statusCode = 'statusCode' in err ? err.statusCode : 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  if (statusCode >= 500) {
    logger.error({ err, stack: err.stack }, 'Unhandled error');
  } else {
    logger.warn({ statusCode, message }, 'Client error');
  }

  return res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && statusCode >= 500
        ? { stack: err.stack }
        : {}),
    },
  });
}
