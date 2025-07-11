/**
 * AI Service for fetching movie recommendations via backend proxy
 * This keeps API keys secure on the server side
 */

// Backend API Configuration
const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://triple-feature-backend-ofyld82rb-tees-projects-fe29777c.vercel.app'
    : 'http://localhost:3001');

/**
 * Fetch movie recommendations from all AI models via backend
 * @param {string} prompt - User's movie vibe description
 * @param {Array} exclude - Optional array of movies to exclude from recommendations
 * @returns {Promise<Array>} - Array of movie recommendations from all sources
 */
export const fetchMovieRecommendations = async (prompt, exclude = []) => {
  try {
    console.log('Fetching recommendations via backend for:', prompt);
    
    // Extract titles of movies to exclude
    // Handle both string arrays and movie objects
    const excludeTitles = exclude.map(item => {
      if (typeof item === 'string') {
        return item;
      } else if (typeof item === 'object' && item.title) {
        return item.title;
      }
      return '';
    }).filter(title => title); // Remove any empty strings
    
    console.log('Excluding titles:', excludeTitles);
    
    const response = await fetch(`${BACKEND_BASE_URL}/api/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        exclude: excludeTitles
      })
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Backend response:', data);
    
    return data.movies || [];
  } catch (error) {
    console.error('Error fetching movie recommendations:', error);
    
    // Fallback to demo data if backend is unavailable
    return getDemoRecommendations(prompt);
  }
};

/**
 * Demo movie recommendations for when backend is unavailable
 */
const getDemoRecommendations = (prompt) => {
  console.log('Using demo recommendations for:', prompt);
  
  const demoMovies = [
    {
      title: "Inception",
      year: 2010,
      summary: "A skilled thief enters people's dreams to steal their secrets, but takes on the challenge of planting an idea in someone's mind through complex layers of shared dreaming.",
      source: "Demo"
    },
    {
      title: "The Matrix",
      year: 1999,
      summary: "A computer hacker discovers that reality as he knows it is a simulated construct created by sentient machines and joins a rebellion to free humanity.",
      source: "Demo"
    },
    {
      title: "Blade Runner 2049",
      year: 2017,
      summary: "A young blade runner discovers a long-buried secret that leads him to track down former blade runner Rick Deckard, who's been missing for thirty years.",
      source: "Demo"
    },
    {
      title: "Interstellar",
      year: 2014,
      summary: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival as Earth faces environmental collapse.",
      source: "Demo"
    },
    {
      title: "Ex Machina",
      year: 2014,
      summary: "A young programmer is selected to participate in a ground-breaking experiment in synthetic intelligence by evaluating the human qualities of a highly advanced humanoid A.I.",
      source: "Demo"
    }
  ];

  // Return a random selection of 5 movies
  return demoMovies.sort(() => Math.random() - 0.5).slice(0, 5);
};

// Legacy exports for backward compatibility (now just proxy to main function)
export const fetchGptRecommendations = async (prompt) => {
  const results = await fetchMovieRecommendations(prompt);
  return results.filter(movie => movie.source === 'GPT-4');
};

export const fetchClaudeRecommendations = async (prompt) => {
  const results = await fetchMovieRecommendations(prompt);
  return results.filter(movie => movie.source === 'Claude');
};

export const fetchGeminiRecommendations = async (prompt) => {
  const results = await fetchMovieRecommendations(prompt);
  return results.filter(movie => movie.source === 'Gemini');
};