import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  const message = err.message || 'Internal Server Error';

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    res.status(400).json({
      success: false,
      status: 'fail',
      message: `A record with this ${field} already exists.`,
    });
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((e: any) => e.message);
    res.status(400).json({
      success: false,
      status: 'fail',
      message: `Validation Error: ${errors.join('; ')}`,
    });
    return;
  }

  // Handle JWT invalid signature
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      status: 'fail',
      message: 'Invalid authorization token.',
    });
    return;
  }

  res.status(statusCode).json({
    success: false,
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
