// This script runs after deployment on Render.com

console.log("=== Post-Deployment Initialization ===");
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log(`Node version: ${process.version}`);
console.log(`Environment: ${process.env.NODE_ENV}`);

try {
  // Log environment information
  console.log(`Server port: ${process.env.PORT}`);
  console.log(`CORS origin: ${process.env.CORS_ORIGIN}`);
  
  // Check critical environment variables (without logging values)
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'OPENAI_API_KEY',
    'STRIPE_SECRET_KEY'
  ];
  
  const missingVars = [];
  
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.error(`⚠️ Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please configure these in your Render.com service settings');
  } else {
    console.log('✅ All required environment variables are configured');
  }
  
  console.log("Post-deployment initialization completed");
} catch (error) {
  console.error("Error during post-deployment initialization:", error);
}