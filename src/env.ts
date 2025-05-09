// Environment variables with fallbacks and validation
const env = {
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
};

// For easier debugging
const isProd = import.meta.env.PROD;
const envPrefix = isProd ? 'Production' : 'Development';

console.log(`[${envPrefix} Environment] Configuration Status:`);
console.log('- OpenAI API Key:', env.OPENAI_API_KEY ? 'Available ✅' : 'Missing ❌');
console.log('- Supabase URL:', env.SUPABASE_URL ? 'Available ✅' : 'Missing ❌');
console.log('- Supabase Anon Key:', env.SUPABASE_ANON_KEY ? 'Available ✅' : 'Missing ❌');

// Additional runtime check for OpenAI API key
if (!env.OPENAI_API_KEY) {
  console.error(`[${envPrefix}] OpenAI API Key is missing! Please check:`);
  console.error('1. Environment variable name should be VITE_OPENAI_API_KEY');
  console.error(`2. ${isProd ? 'Production: Check Netlify Environment Variables' : 'Development: Check your .env file'}`);
  console.error('3. Ensure the API key is correctly formatted and not empty');
  console.error('4. Verify the key is set for all deploy contexts in Netlify');
  
  // Log additional debug information
  console.debug('Available environment variables:', Object.keys(import.meta.env)
    .filter(key => !key.includes('VITE_OPENAI_API_KEY')) // Don't log the actual API key
    .map(key => `${key}: ${import.meta.env[key] ? 'set' : 'not set'}`));
}

export default env;