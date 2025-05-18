# MakeItShorter Backend

This repository contains the backend API for the MakeItShorter application, a tool that helps users optimize the length of their emails and messages.

## Features

- Email enhancement API
- OpenAI integration
- Word count control
- Health check endpoint

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- OpenAI API key

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```
   # OpenAI API key
   OPENAI_API_KEY=your-openai-api-key

   # Server configuration
   PORT=3000

   # CORS settings
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,https://makeitshorter.netlify.app
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

### Health Check
```
GET /api/health
```
Returns the server status and whether AI features are enabled.

### Enhance Email
```
POST /api/enhance
```
Enhances an email or text content to a specific word count.

Request body:
```json
{
  "content": "Your email or text content",
  "tone": "professional with gen-z style, balanced formality, in a Tech Company context, emphasizing Tech-savvy, Concise, Emoji-friendly 😊",
  "targetWords": 100,
  "inputType": "email",
  "enforceExactWordCount": true
}
```

Response:
```json
{
  "enhancedContent": "Subject: Your Enhanced Subject\n\nYour enhanced content...",
  "wordCount": 100,
  "warning": "Optional warning message if word count is off"
}
```

## Deployment

The backend is designed to be deployed to a Node.js hosting service like Render, Heroku, or Railway:

1. Set up a new web service on your chosen platform
2. Connect your GitHub repository
3. Configure the build settings:
   - Build command: `npm install`
   - Start command: `npm start`
4. Set the required environment variables:
   - `OPENAI_API_KEY`
   - `PORT` (if needed by your hosting provider)
   - `ALLOWED_ORIGINS` (comma-separated list of frontend origins)

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `PORT`: The port to run the server on (defaults to 3000)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS

## Tech Stack

- Node.js
- Express
- OpenAI API

## License

This project is proprietary and confidential.