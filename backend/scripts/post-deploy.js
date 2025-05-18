// This script runs after deployment on Render.com
import { logger } from "../dist/utils/logger.js";

logger.info("Starting post-deployment tasks");

try {
  // Log environment information
  logger.info(`Node environment: ${process.env.NODE_ENV}`);
  logger.info(`Server port: ${process.env.PORT}`);
  logger.info(`CORS origin: ${process.env.CORS_ORIGIN}`);
  
  // Check critical environment variables (without logging values)
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'OPENAI_API_KEY',
    'STRIPE_SECRET_KEY'
  ];
  
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      logger.error(`Missing required environment variable: ${varName}`);
    } else {
      logger.info(`Environment variable present: ${varName}`);
    }
  }
  
  logger.info("Post-deployment tasks completed successfully");
} catch (error) {
  logger.error("Error during post-deployment tasks", error);
}