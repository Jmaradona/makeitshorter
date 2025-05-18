// Environment variables with fallbacks - for Render.com deployment
// All required env variables should be configured in Render's environment settings

// Use import.meta.env for Vite environment variables
const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  API_URL: import.meta.env.VITE_API_URL || (
    // Fallback logic for development
    import.meta.env.DEV 
      ? 'http://localhost:3001' 
      : window.location.hostname === 'localhost'
        ? 'http://localhost:3001'
        : window.location.hostname.includes('render.com') 
          ? `https://${window.location.hostname.replace('makeitshorter', 'makeitshorter-api')}`
          : 'https://api.makeitshorter.com'
  )
};

// For easier debugging
const isProd = import.meta.env.PROD;
const envPrefix = isProd ? 'Production' : 'Development';

console.log(`[${envPrefix} Environment] Configuration Status:`);
console.log('- API URL:', env.API_URL);
console.log('- Supabase URL:', env.SUPABASE_URL ? 'Available ✅' : 'Missing ❌');
console.log('- Supabase Anon Key:', env.SUPABASE_ANON_KEY ? 'Available ✅' : 'Missing ❌');

// Warning for missing configuration
if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  console.warn(`[${envPrefix}] Supabase configuration is incomplete. Authentication features may be limited.`);
  console.warn('Please ensure these variables are set in Render.com environment settings.');
}

export default env;