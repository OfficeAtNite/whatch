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
    console.log('=== AI SERVICE DEBUG START ===');
    console.log('Fetching recommendations via backend for:', prompt);
    console.log('Backend URL being used:', BACKEND_BASE_URL);
    console.log('Environment NODE_ENV:', process.env.NODE_ENV);
    console.log('Environment REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
    
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
    
    // Remove duplicates from exclude list
    const uniqueExcludeTitles = [...new Set(excludeTitles)];
    
    console.log('Excluding titles:', uniqueExcludeTitles.length, 'unique movies');
    if (uniqueExcludeTitles.length > 10) {
      console.log('Sample excluded titles:', uniqueExcludeTitles.slice(0, 10).join(', '), '...');
    } else {
      console.log('Excluded titles:', uniqueExcludeTitles.join(', '));
    }
    
    const requestBody = {
      prompt,
      exclude: uniqueExcludeTitles
    };
    console.log('Request body:', JSON.stringify(requestBody));
    
    const fullUrl = `${BACKEND_BASE_URL}/api/recommendations`;
    console.log('Making request to:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend request failed. Status:', response.status, 'Error:', errorText);
      throw new Error(`Backend request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Backend response received:', data);
    console.log('Response type:', typeof data);
    console.log('Response keys:', data ? Object.keys(data) : 'no data');
    
    // Handle different possible response structures
    let movies = [];
    
    if (data && Array.isArray(data.movies)) {
      // Expected format: { movies: [...] }
      movies = data.movies;
      console.log('Found movies in expected format:', movies.length);
    } else if (Array.isArray(data)) {
      // Fallback: direct array response
      movies = data;
      console.log('Found movies as direct array:', movies.length);
    } else if (data && data.recommendations && Array.isArray(data.recommendations)) {
      // Alternative format: { recommendations: [...] }
      movies = data.recommendations;
      console.log('Found movies in recommendations format:', movies.length);
    } else {
      console.error('Invalid response structure. Expected { movies: [...] }, got:', JSON.stringify(data));
      console.log('Response keys:', data ? Object.keys(data) : 'no data');
      console.log('=== AI SERVICE DEBUG END (EMPTY RESPONSE) ===');
      return [];
    }
    
    console.log('Final movies array length:', movies.length);
    console.log('Sample movie titles:', movies.slice(0, 3).map(m => m.title));
    console.log('=== AI SERVICE DEBUG END (SUCCESS) ===');
    return movies;
  } catch (error) {
    console.error('=== AI SERVICE ERROR ===');
    console.error('Error fetching movie recommendations:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.log('=== AI SERVICE DEBUG END (ERROR) ===');
    
    // Fallback to demo data if backend is unavailable
    console.log('Falling back to demo recommendations');
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