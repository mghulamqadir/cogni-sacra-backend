export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational = true;
  public readonly code: string;

  constructor(message: string, statusCode: number, code = 'REQUEST_FAILED') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}
