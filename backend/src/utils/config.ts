// Configuration management without relying on .env files
// All values are expected to be set in the environment (e.g., Render.com)

export const config = {
  // Server configuration
  port: process.env.PORT || '3001',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Supabase configuration
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
  },
  
  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    defaultAssistantId: 'asst_F4jvQcayYieO8oghTPxC7Qel',
  },
  
  // Stripe configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  
  // Log configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  // Validate that required configs are present
  validate() {
    const missingVars = [];
    
    // Required in all environments
    if (!this.supabase.url) missingVars.push('SUPABASE_URL');
    if (!this.supabase.serviceKey) missingVars.push('SUPABASE_SERVICE_KEY');
    if (!this.openai.apiKey) missingVars.push('OPENAI_API_KEY');
    
    // Only required in production
    if (this.nodeEnv === 'production') {
      if (!this.stripe.secretKey) missingVars.push('STRIPE_SECRET_KEY');
      if (!this.stripe.webhookSecret) missingVars.push('STRIPE_WEBHOOK_SECRET');
    }
    
    if (missingVars.length > 0) {
      console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
      console.error('Please set these variables in your Render.com service configuration');
      
      // Don't exit in development to allow for easier testing
      if (this.nodeEnv === 'production') {
        return false;
      }
    }
    
    return true;
  },
  
  // Log configuration status
  logStatus() {
    console.log('=== Configuration Status ===');
    console.log(`Environment: ${this.nodeEnv}`);
    console.log(`Port: ${this.port}`);
    console.log(`CORS Origin: ${this.corsOrigin}`);
    console.log(`Supabase URL: ${this.supabase.url ? '✅ Set' : '❌ Missing'}`);
    console.log(`Supabase Service Key: ${this.supabase.serviceKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`Supabase Anon Key: ${this.supabase.anonKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`OpenAI API Key: ${this.openai.apiKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`Stripe Secret Key: ${this.stripe.secretKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`Stripe Webhook Secret: ${this.stripe.webhookSecret ? '✅ Set' : '❌ Missing'}`);
    console.log('============================');
  }
};