# Deployment Guide for Make it Shorter!!!

This guide provides step-by-step instructions for manually deploying the application to Render.com.

## Prerequisites

1. A Render.com account (https://render.com)
2. A GitHub repository with your project code
3. Supabase account and project
4. OpenAI API key
5. Stripe account (for payments)

## Render.com Deployment Steps

### Step 1: Deploy the Backend API

1. Log into your Render.com dashboard
2. Click on "New" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `makeitshorter-api` (or your preferred name)
   - **Runtime**: `Node`
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && node dist/index.js`
   - **Root Directory**: Leave blank to use repository root
5. Click "Advanced" and add the following environment variables:

   | Key                    | Value                                   |
   |------------------------|-----------------------------------------|
   | NODE_ENV               | `production`                            |
   | PORT                   | `10000` (Render's default)              |
   | CORS_ORIGIN            | Leave blank for now (we'll update later)|
   | SUPABASE_URL           | Your Supabase project URL               |
   | SUPABASE_SERVICE_KEY   | Your Supabase service key               |
   | SUPABASE_ANON_KEY      | Your Supabase anon key                  |
   | OPENAI_API_KEY         | Your OpenAI API key                     |
   | STRIPE_SECRET_KEY      | Your Stripe secret key                  |
   | STRIPE_WEBHOOK_SECRET  | Your Stripe webhook secret              |

6. Select a plan (Free or higher)
7. Click "Create Web Service"

### Step 2: Deploy the Frontend Application

1. In your Render dashboard, click on "New" and select "Static Site"
2. Connect your GitHub repository
3. Configure the site:
   - **Name**: `makeitshorter` (or your preferred name)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Root Directory**: Leave blank to use repository root
4. Click "Advanced" and add the following environment variables:

   | Key                    | Value                                   |
   |------------------------|-----------------------------------------|
   | VITE_API_URL           | URL of your backend API service         |
   | VITE_SUPABASE_URL      | Your Supabase project URL               |
   | VITE_SUPABASE_ANON_KEY | Your Supabase anon key                  |

5. Select a plan (Free or higher)
6. Click "Create Static Site"

### Step 3: Update CORS Configuration

1. After both services are deployed, go back to your backend API service in Render
2. Click "Environment" in the left sidebar
3. Find the `CORS_ORIGIN` variable and click "Edit"
4. Enter the URL of your frontend application (e.g., `https://makeitshorter.onrender.com`)
5. Click "Save Changes"
6. Click "Manual Deploy" and select "Clear build cache & deploy"

### Step 4: Configure Stripe Webhook

1. In your Stripe dashboard, go to "Developers" > "Webhooks"
2. Click "Add endpoint"
3. Enter your backend webhook URL: `https://your-backend-api.onrender.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the "Signing Secret"
7. Go back to your backend API service in Render
8. Update the `STRIPE_WEBHOOK_SECRET` environment variable with the copied secret
9. Click "Save Changes" and redeploy

## Testing the Deployment

1. Visit your frontend URL (e.g., `https://makeitshorter.onrender.com`)
2. Visit the health check endpoint of your backend API (e.g., `https://makeitshorter-api.onrender.com/health`)
3. Test the authentication flow by signing in with Google
4. Test the email enhancement functionality
5. Test the subscription process (use Stripe test cards)

## Troubleshooting

### Backend API Connection Issues

If the frontend can't connect to the backend:
1. Check the `VITE_API_URL` in your frontend environment variables
2. Verify the backend service is running
3. Check CORS configuration in the backend

### Authentication Issues

If authentication is not working:
1. Verify Supabase URL and keys in both frontend and backend
2. Check the redirect URLs in your Supabase project settings

### Payment Processing Issues

If payments aren't processing:
1. Confirm Stripe keys are correctly set
2. Verify the webhook is properly configured and receiving events
3. Test with Stripe test cards (e.g., 4242 4242 4242 4242)

## Monitoring

- Use Render's built-in logs to monitor your application
- Set up Stripe webhook monitoring in the Stripe dashboard
- Create a simple monitoring endpoint that checks critical services

## Scaling

If you need to scale your application:
1. Upgrade to a higher tier in Render.com
2. Consider adding a database cache for frequently accessed data
3. Implement rate limiting for the AI enhancement endpoint