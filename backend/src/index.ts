import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler.js';
import { config } from './utils/config.js';

// Import routes
import { apiRouter } from './routes/index.js';

// Log configuration status
config.logStatus();

// Check for required environment variables
if (!config.validate() && config.nodeEnv === 'production') {
  console.error('Missing required configuration. Exiting.');
  process.exit(1);
}

// Configure express app
const app = express();
const PORT = parseInt(config.port, 10);

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
  console.log(`CORS configured for origin: ${config.corsOrigin}`);
});

export default app;