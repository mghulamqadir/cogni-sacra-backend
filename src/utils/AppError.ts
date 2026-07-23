export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational = true;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
