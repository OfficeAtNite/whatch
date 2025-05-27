# API Setup Instructions for Triple Feature

To use the Triple Feature movie recommendation app with real AI results, you need to configure the following API keys:

## Required API Keys

### 1. OpenRouter API Key (for GPT and Claude)
- Visit: https://openrouter.ai/
- Sign up for an account
- Get your API key from the dashboard
- Replace `REACT_APP_OPENROUTER_API_KEY` in `.env` file

### 2. Google Gemini API Key
- Visit: https://makersuite.google.com/app/apikey
- Sign in with your Google account
- Create a new API key
- Replace `REACT_APP_GEMINI_API_KEY` in `.env` file

### 3. TMDB API Key (for movie details and posters)
- Visit: https://www.themoviedb.org/settings/api
- Sign up for a free account
- Request an API key
- Replace `REACT_APP_TMDB_API_KEY` in `.env` file

## Configuration

1. Open the `.env` file in the project root
2. Replace the placeholder values with your actual API keys:

```env
# AI API Keys - Replace with your own keys
REACT_APP_OPENROUTER_API_KEY=your_openrouter_key_here
REACT_APP_GEMINI_API_KEY=your_gemini_key_here
REACT_APP_TMDB_API_KEY=your_tmdb_key_here
```

3. Restart the development server:
```bash
npm start
```

## Testing

Once configured, the app will:
- Use GPT, Claude, and Gemini for movie recommendations
- Fetch real movie details and posters from TMDB
- Apply filters to enhance AI prompts for targeted results

## Filter Functionality

The filter system enhances AI prompts with:
- **Genre**: Focuses recommendations on specific genres
- **Decade**: Targets movies from specific time periods
- **Rating**: Filters by minimum rating thresholds
- **Duration**: Preferences for movie length
- **AI Models**: Choose which AI models to query

Example enhanced prompt:
```
Original: "action movies"
With filters: "action movies Focus on sci-fi movies. Recommend movies from the 2010s. Only suggest movies with ratings of 8/10 or higher."