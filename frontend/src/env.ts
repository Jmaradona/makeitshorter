// Environment variables with fallbacks and validation
const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001'
};

// For easier debugging
const isProd = import.meta.env.PROD;
const envPrefix = isProd ? 'Production' : 'Development';

console.log(`[${envPrefix} Environment] Configuration Status:`);
console.log('- API URL:', env.API_URL);
console.log('- Supabase URL:', env.SUPABASE_URL ? 'Available ✅' : 'Missing ❌');
console.log('- Supabase Anon Key:', env.SUPABASE_ANON_KEY ? 'Available ✅' : 'Missing ❌');

// Check for configuration issues
if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  console.error(`[${envPrefix}] Supabase configuration is incomplete. Authentication features may be limited.`);
  console.error(`1. Environment variables should be VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY`);
  console.error(`2. ${isProd ? 'Production: Check Environment Variables in your hosting platform' : 'Development: Check your .env file'}`);
}

export default env;