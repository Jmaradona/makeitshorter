import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { enhanceEmailRoute } from './routes/enhance.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS to allow requests from all deployment domains
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://makeitshorter.netlify.app'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.use(express.json());

// Basic route to check if server is running
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.get('/api/health', (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    aiEnabled: !!apiKey
  });
});

// Register routes
app.use('/api', enhanceEmailRoute);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  if (!process.env.OPENAI_API_KEY) {
    console.log('\nWARNING: OpenAI API key is missing. AI features will be disabled.');
    console.log('To enable AI features, add OPENAI_API_KEY to your environment variables.\n');
  }
});