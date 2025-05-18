import { Router } from 'express';
import { enhanceEmail } from '../controllers/ai.controller.js';
import { validateToken } from '../middleware/auth.middleware.js';

export const aiRouter = Router();

// POST /api/ai/enhance - Enhance email content
aiRouter.post('/enhance', validateToken, enhanceEmail);