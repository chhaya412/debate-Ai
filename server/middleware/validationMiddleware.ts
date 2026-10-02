import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

export function validateBody(requiredFields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missing = requiredFields.filter(
      field => req.body[field] === undefined || req.body[field] === null || req.body[field] === ''
    );

    if (missing.length > 0) {
      return next(
        new AppError(`Missing required request body fields: ${missing.join(', ')}`, 400)
      );
    }
    next();
  };
}
