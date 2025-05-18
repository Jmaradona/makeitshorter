# MakeItShorter Frontend

This repository contains the frontend for the MakeItShorter application, a tool that helps users optimize the length of their emails and messages.

## Features

- Interactive email editor with resize functionality
- Customizable persona settings
- Multiple tone and style options
- Dark mode
- Authentication via Supabase
- Subscription management via Stripe

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Backend API (separate repository)
- Supabase account
- Stripe account (for payments)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```
   # Supabase configuration
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

   # API configuration
   VITE_API_URL=http://localhost:3000/api
   
   # OpenAI configuration (for test mode only)
   VITE_OPENAI_API_KEY=your-openai-api-key
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## Project Structure

```
frontend/
├── public/             # Static assets
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── services/       # API and service integration
│   ├── store/          # State management (Zustand)
│   ├── lib/            # Utility libraries
│   ├── utils/          # Helper functions
│   ├── types/          # TypeScript type definitions
│   ├── env.ts          # Environment variable handling
│   ├── App.tsx         # Main application component
│   ├── index.css       # Global styles
│   └── main.tsx        # Application entry point
└── package.json        # Project dependencies and scripts
```

## Building for Production

```
npm run build
```

This will create a `dist` directory with the compiled and optimized application.

## Deployment

The frontend is designed to be deployed to Netlify:

1. Connect your GitHub repository
2. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Set the required environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL`
4. Deploy

## Environment Variables

For production deployment, set these environment variables in Netlify:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_API_URL`: URL to your deployed backend API (e.g., https://makeitshorter-api.onrender.com/api)

## Tech Stack

- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Zustand (state management)
- Supabase (auth & database)
- Stripe (payments)

## License

This project is proprietary and confidential.