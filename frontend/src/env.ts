// Environment variables with fallbacks and validation
const env = {
  OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || ''
};

// For easier debugging
const isProd = process.env.NODE_ENV === 'production';
const envPrefix = isProd ? 'Production' : 'Development';

console.log(`[${envPrefix} Environment] Configuration Status:`);
console.log('- OpenAI API Key:', env.OPENAI_API_KEY ? 'Available ✅' : 'Missing ❌');
console.log('- Supabase URL:', env.SUPABASE_URL ? 'Available ✅' : 'Missing ❌');
console.log('- Supabase Anon Key:', env.SUPABASE_ANON_KEY ? 'Available ✅' : 'Missing ❌');
console.log('- Backend URL:', env.BACKEND_URL ? 'Available ✅' : 'Missing ❌');

// Additional runtime check for OpenAI API key
if (!env.OPENAI_API_KEY) {
  console.error(`[${envPrefix}] OpenAI API Key is missing! Please check:`);
  console.error('1. Environment variable name should be NEXT_PUBLIC_OPENAI_API_KEY');
  console.error(`2. ${isProd ? 'Production: Check Environment Variables' : 'Development: Check your .env.local file'}`);
  console.error('3. Ensure the API key is correctly formatted and not empty');
}

export default env;