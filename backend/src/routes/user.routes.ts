import { Router } from 'express';
import { 
  getUserProfile, 
  updateUserProfile 
} from '../controllers/user.controller.js';
import { validateToken } from '../middleware/auth.middleware.js';

export const userRouter = Router();

// GET /api/users/profile - Get user profile
userRouter.get('/profile', validateToken, getUserProfile);

// PUT /api/users/profile - Update user profile
userRouter.put('/profile', validateToken, updateUserProfile);