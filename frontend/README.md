# Make it Shorter!!! - Frontend

The frontend React application for the Make it Shorter!!! email enhancement service.

## Features

- Interactive email editing
- AI-powered content enhancement
- Adjustable email length
- Tone selection
- Persona customization
- User authentication
- Subscription management
- Light/dark mode

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

### Installation

1. Install dependencies:
```bash
npm install
```

## Environment Variables

All environment variables should be configured in your Render.com dashboard:

- `VITE_API_URL` - URL of the backend API service
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

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

Preview the production build:

```bash
npm run preview
```

## Architecture

- React for UI components
- Framer Motion for animations
- Tailwind CSS for styling
- Zustand for state management
- React Router for routing
- React Hot Toast for notifications
- Supabase.js for authentication

## Folder Structure

- `src/components/`: UI components
- `src/pages/`: Page components
- `src/services/`: API service functions
- `src/store/`: Zustand state stores
- `src/utils/`: Utility functions
- `src/lib/`: Library integrations (Supabase)
- `src/types/`: TypeScript type definitions

## API Integration

This frontend connects to the backend API using the environment variable `VITE_API_URL`. All API requests are made to this endpoint using the `fetch` API with proper authentication headers when needed.