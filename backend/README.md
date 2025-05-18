# Make it Shorter!!! - Backend API

The backend Express API for the Make it Shorter!!! email enhancement service.

## Features

- RESTful API for email enhancement
- OpenAI integration
- Stripe payment processing
- Supabase authentication and data storage
- Usage tracking and limiting

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

### Installation

1. Install dependencies:
```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

### Building

Build for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Environment Variables

All environment variables should be configured in your Render.com dashboard:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)
- `CORS_ORIGIN` - Allowed CORS origin
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service key
- `SUPABASE_ANON_KEY` - Your Supabase anon key
- `OPENAI_API_KEY` - Your OpenAI API key
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret

## API Endpoints

### Authentication

All authenticated endpoints require a Bearer token in the Authorization header.
The token should be obtained from Supabase authentication.

### AI Enhancement

- `POST /api/ai/enhance`: Enhance email content
  - Request body: `{ content, tone, targetWords, inputType, enforceExactWordCount }`
  - Requires authentication

### Usage

- `GET /api/usage/check`: Check current usage limits
  - Requires authentication
- `POST /api/usage/record`: Record a new API usage
  - Requires authentication
- `POST /api/usage/reset`: Reset usage limits (admin only)
  - Requires authentication

### Stripe

- `POST /api/stripe/create-checkout-session`: Create a Stripe checkout session
  - Request body: `{ price_id, success_url, cancel_url, mode }`
  - Requires authentication
- `POST /api/stripe/webhook`: Handle Stripe webhooks
  - No authentication required, uses Stripe signature validation
- `GET /api/stripe/subscription`: Get user subscription
  - Requires authentication
- `GET /api/stripe/orders`: Get user orders
  - Requires authentication
- `GET /api/stripe/has-subscription`: Check if user has active subscription
  - Requires authentication

### Users

- `GET /api/users/profile`: Get user profile
  - Requires authentication
- `PUT /api/users/profile`: Update user profile
  - Request body: User profile object
  - Requires authentication

## Architecture

- Express.js for API server
- Supabase for authentication and data storage
- OpenAI for AI enhancement
- Stripe for payment processing
- TypeScript for type safety

## Folder Structure

- `src/controllers/`: API route handlers
- `src/middleware/`: Express middleware
- `src/routes/`: API route definitions
- `src/services/`: Business logic
- `src/utils/`: Utility functions
- `src/types/`: TypeScript type definitions