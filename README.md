# Make it Shorter!!! - Email Enhancement App

A modern web application for optimizing and transforming emails to make them more concise and effective.

## Project Structure

This is a monorepo containing both the frontend and backend code:

- `frontend/` - React application with Vite
- `backend/` - Express API server

## Deployment to Render.com

### Manual Deployment Setup

1. **Backend Web Service**
   - Create a new Web Service in Render
   - Connect to your repository
   - Configure as follows:
     - **Name**: makeitshorter-api (or your preferred name)
     - **Runtime**: Node
     - **Build Command**: `cd backend && npm install && npm run build`
     - **Start Command**: `cd backend && node dist/index.js`
     - **Root Directory**: (Leave blank to use repository root)

   - **Required Environment Variables**:
     - `NODE_ENV`: `production`
     - `PORT`: `10000` (Render's default)
     - `CORS_ORIGIN`: (Your frontend URL, e.g., https://makeitshorter.onrender.com)
     - `SUPABASE_URL`: (Your Supabase URL)
     - `SUPABASE_SERVICE_KEY`: (Your Supabase service key)
     - `SUPABASE_ANON_KEY`: (Your Supabase anonymous key)
     - `OPENAI_API_KEY`: (Your OpenAI API key)
     - `STRIPE_SECRET_KEY`: (Your Stripe secret key)
     - `STRIPE_WEBHOOK_SECRET`: (Your Stripe webhook secret)

2. **Frontend Static Site**
   - Create a new Static Site in Render
   - Connect to your repository
   - Configure as follows:
     - **Name**: makeitshorter (or your preferred name)
     - **Build Command**: `cd frontend && npm install && npm run build`
     - **Publish Directory**: `frontend/dist`
     - **Root Directory**: (Leave blank to use repository root)

   - **Required Environment Variables**:
     - `VITE_API_URL`: (Your backend URL, e.g., https://makeitshorter-api.onrender.com)
     - `VITE_SUPABASE_URL`: (Your Supabase URL)
     - `VITE_SUPABASE_ANON_KEY`: (Your Supabase anonymous key)

3. **Configure CORS**
   - After deploying both services, update the backend's CORS_ORIGIN to match your frontend URL

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/makeitshorter.git
cd makeitshorter
```

2. Install dependencies for both frontend and backend
```bash
npm install
```

3. Start development servers
```bash
npm run dev
```

## Features

- Email optimization with AI assistance
- Adjustable email length with intuitive slider
- Multiple communication tones
- Persona customization
- User authentication with Google
- Subscription management with Stripe
- Light/dark mode