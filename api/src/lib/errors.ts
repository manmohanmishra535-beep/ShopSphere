export class AppError extends Error {
  status: number;
  code: string;
  details: unknown[];

  constructor(status: number, code: string, message: string, details: unknown[] = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details: unknown[] = []) =>
  new AppError(400, "BAD_REQUEST", message, details);

export const unauthorized = (message = "Sign in to continue") =>
  new AppError(401, "UNAUTHORIZED", message);

export const forbidden = (message = "You do not have access to this resource") =>
  new AppError(403, "FORBIDDEN", message);

export const notFound = (message = "Resource not found") =>
  new AppError(404, "NOT_FOUND", message);

export const conflict = (code: string, message: string, details: unknown[] = []) =>
  new AppError(409, code, message, details);

export const outOfStock = (message = "Not enough stock available") =>
  new AppError(409, "OUT_OF_STOCK", message);
