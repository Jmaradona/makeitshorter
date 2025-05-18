import { Router } from 'express';
import { 
  checkUsage, 
  recordUsage, 
  resetUsage 
} from '../controllers/usage.controller.js';
import { validateToken } from '../middleware/auth.middleware.js';

export const usageRouter = Router();

// GET /api/usage/check - Check current usage limits
usageRouter.get('/check', validateToken, checkUsage);

// POST /api/usage/record - Record a new API usage
usageRouter.post('/record', validateToken, recordUsage);

// POST /api/usage/reset - Reset usage limits (admin or system only)
usageRouter.post('/reset', validateToken, resetUsage);