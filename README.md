# SpendWise

A personal expense tracking application with AI-powered insights and goal management.

## Setup Checklist

### Backend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file in the root directory:**
   ```bash
   touch .env
   ```

3. **Add required environment variables to `.env`:**
   ```env
   GOOGLE_AI_API_KEY=your_google_ai_api_key_here
   MONGO_URI=mongodb://127.0.0.1:27017/spendwise
   PORT=4000
   ```

4. **Start the backend server:**
   ```bash
   npm start
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env.local` file:**
   ```bash
   touch .env.local
   ```

4. **Add required environment variables to `.env.local`:**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000
   NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
   NEXT_PUBLIC_DEFAULT_USER=test-user-1
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## Getting Your Google AI API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key and add it to your backend `.env` file

## Project Structure

```
SPENDWISE/
├── app.js                 # Backend Express server
├── models/                # MongoDB models
├── routes/                # API routes
├── services/              # Business logic services
├── frontend/              # Next.js frontend application
│   ├── app/              # Next.js app directory
│   ├── lib/              # API client utilities
│   └── components/       # React components
└── .env                  # Backend environment variables (not committed)
```

## Features

- 📊 Expense tracking and categorization
- 🤖 AI-powered spending insights
- 🎯 Savings goals management
- 📈 What-if scenario analysis
- 🏆 Achievement system
- 💡 Personalized financial tips

## Tech Stack

- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **AI:** Google Gemini API
- **Animations:** Framer Motion

