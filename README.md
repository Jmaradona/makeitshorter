# Make it Shorter!!! - Email Enhancement App

A modern web application for optimizing and transforming emails to make them more concise and effective.

## Project Structure

This is a monorepo containing both the frontend and backend code:

- `frontend/` - React application with Vite
- `backend/` - Express API server

## Getting Started

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

3. Create environment files

For the backend:
```bash
cp backend/.env.example backend/.env
```

For the frontend:
```bash
cp frontend/.env.example frontend/.env
```

4. Fill in your environment variables:
   - Supabase credentials
   - OpenAI API key
   - Stripe API keys

### Development

Run the complete application (both frontend and backend):

```bash
npm run dev
```

Or run them separately:

```bash
# Run just the frontend
npm run dev:frontend

# Run just the backend
npm run dev:backend
```

### Building for Production

```bash
# Build both frontend and backend
npm run build

# Build just the frontend
npm run build:frontend

# Build just the backend
npm run build:backend
```

### Deployment

This project is configured for deployment on [Render.com](https://render.com) using the `render.yaml` blueprint.

To deploy:
1. Push your code to a GitHub repository
2. Create a new Render blueprint from your repository
3. Configure your environment variables in the Render dashboard

## Features

- Email optimization with AI assistance
- Adjustable email length with intuitive slider
- Multiple communication tones
- Persona customization
- User authentication with Google
- Subscription management with Stripe
- Light/dark mode

## Technologies

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Supabase Auth
- Zustand for state management

### Backend
- Node.js
- Express
- TypeScript
- OpenAI API
- Supabase (PostgreSQL)
- Stripe for payments

## License

This project is licensed under the MIT License - see the LICENSE file for details.