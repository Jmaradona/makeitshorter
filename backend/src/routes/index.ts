import { Router } from 'express';
import { aiRouter } from './ai.routes.js';
import { usageRouter } from './usage.routes.js';
import { stripeRouter } from './stripe.routes.js';
import { userRouter } from './user.routes.js';

export const apiRouter = Router();

apiRouter.use('/ai', aiRouter);
apiRouter.use('/usage', usageRouter);
apiRouter.use('/stripe', stripeRouter);
apiRouter.use('/users', userRouter);

// API version and info endpoint
apiRouter.get('/', (req, res) => {
  res.json({
    name: 'Make it Shorter API',
    version: '1.0.0',
    status: 'operational'
  });
});