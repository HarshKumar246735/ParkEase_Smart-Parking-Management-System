import mongoose from 'mongoose';
import { badRequest } from '../utils/ApiError.js';

export const validateId = (...params) => (req, res, next) => {
  for (const p of params) {
    if (!mongoose.isValidObjectId(req.params[p]) || String(req.params[p]).length !== 24) return next(badRequest(`Invalid ${p}`));
  }
  next();
};

/** Validates optional ObjectId query params (e.g. ?floorId=). */
export const validateQueryIds = (...keys) => (req, res, next) => {
  for (const k of keys) {
    const v = req.query[k];
    if (v !== undefined && (typeof v !== 'string' || !mongoose.isValidObjectId(v) || v.length !== 24)) return next(badRequest(`Invalid ${k}`));
  }
  next();
};
