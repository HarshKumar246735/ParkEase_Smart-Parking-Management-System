import { isProd } from '../config/env.js';

/** Adds res.ok() and the X-Server-Time header (the frontend syncs its clock offset from it). */
export function responseHelpers(req, res, next) {
  res.ok = (data, status = 200, message) => {
    res.setHeader('X-Server-Time', new Date().toISOString());
    res.status(status).json({ success: true, message, data });
  };
  next();
}

export const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl.split('?')[0]}`, code: 'NOT_FOUND' });
};

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message;
  let code = err.code && typeof err.code === 'string' ? err.code : undefined;
  let errors = err.errors;

  if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    code = 'VALIDATION_ERROR';
    errors = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    message = 'Validation failed';
  } else if (err.name === 'CastError') {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    code = 'DUPLICATE';
    message = 'A record with these details already exists';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body too large';
  } else if (!err.status) {
    status = 500;
    console.error('[error]', req.method, req.originalUrl, err);
    message = 'Something went wrong on our side. Please try again.';
    code = 'INTERNAL_ERROR';
  }
  if (status >= 500 && err.status) console.error('[error]', err);
  res.setHeader('X-Server-Time', new Date().toISOString());
  res.status(status).json({ success: false, message, code, errors, ...(isProd ? {} : { debug: status === 500 ? String(err.message) : undefined }) });
}
