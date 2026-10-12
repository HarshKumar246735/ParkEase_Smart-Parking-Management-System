export class ApiError extends Error {
  constructor(status, message, { code, errors } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}
export const badRequest = (m, errors) => new ApiError(400, m, { errors, code: 'VALIDATION_ERROR' });
export const unauthorized = (m = 'Authentication required') => new ApiError(401, m, { code: 'UNAUTHORIZED' });
export const forbidden = (m = 'You do not have permission to do this') => new ApiError(403, m, { code: 'FORBIDDEN' });
export const notFound = (m = 'Resource not found') => new ApiError(404, m, { code: 'NOT_FOUND' });
export const conflict = (m, code = 'CONFLICT') => new ApiError(409, m, { code });
export const gone = (m, code = 'GONE') => new ApiError(410, m, { code });
