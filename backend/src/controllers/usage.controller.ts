import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { 
  checkUserUsage, 
  recordUserUsage,
  resetUserUsage
} from '../services/usage.service.js';

// Check current usage status
export const checkUsage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    const usageStatus = await checkUserUsage(userId);
    
    res.status(200).json(usageStatus);
  } catch (error) {
    next(error);
  }
};

// Record a usage
export const recordUsage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    const updatedUsage = await recordUserUsage(userId);
    
    res.status(200).json(updatedUsage);
  } catch (error) {
    next(error);
  }
};

// Reset usage (admin or system only)
export const resetUsage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.userId;
    const adminId = req.user?.id;
    
    // Check if user is admin (simplified; in production use proper role checks)
    const isAdmin = adminId === process.env.ADMIN_USER_ID;
    
    if (!isAdmin && adminId !== userId) {
      throw new AppError('Unauthorized to reset usage', 403);
    }
    
    const result = await resetUserUsage(userId);
    
    res.status(200).json({
      success: true,
      message: 'Usage reset successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};