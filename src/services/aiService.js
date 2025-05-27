import axios from 'axios';

// API keys from environment variables
const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

// Base URLs for API requests
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/**
 * Fetch movie recommendations from GPT via OpenRouter
 * @param {string} prompt - User's movie vibe description
 * @returns {Promise<Array>} - Array of movie recommendations
 */
export const fetchGptRecommendations = async (prompt) => {
  try {
    console.log('Making GPT request with API key:', OPENROUTER_API_KEY ? 'Present' : 'Missing');
    
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a movie recommendation expert. Provide exactly 5 movie recommendations based on the user\'s description. For each movie, include the title, year, and a brief summary. Return your response as a JSON object with a "movies" array containing objects with "title", "year", and "summary" fields.'
          },
          {
            role: 'user',
            content: `Recommend movies with this vibe: ${prompt}`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3001',
          'X-Title': 'Triple Feature Movie Recommendations'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    console.log('GPT Response:', content);
    
    // Try to parse JSON from the response
    let recommendations;
    try {
      recommendations = JSON.parse(content);
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
                        content.match(/```\n([\s\S]*?)\n```/) ||
                        content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON from response');
      }
    }
    
    return (recommendations.movies || []).map(movie => ({
      ...movie,
      source: 'GPT'
    }));
  } catch (error) {
    console.error('Error fetching GPT recommendations:', error);
    return [];
  }
};

/**
 * Fetch movie recommendations from Claude via OpenRouter
 * @param {string} prompt - User's movie vibe description
 * @returns {Promise<Array>} - Array of movie recommendations
 */
export const fetchClaudeRecommendations = async (prompt) => {
  try {
    console.log('Making Claude request with API key:', OPENROUTER_API_KEY ? 'Present' : 'Missing');
    
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: 'You are a movie recommendation expert. Provide exactly 5 movie recommendations based on the user\'s description. For each movie, include the title, year, and a brief summary. Return your response as a JSON object with a "movies" array containing objects with "title", "year", and "summary" fields.'
          },
          {
            role: 'user',
            content: `Recommend movies with this vibe: ${prompt}`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3001',
          'X-Title': 'Triple Feature Movie Recommendations'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    console.log('Claude Response:', content);
    
    // Try to parse JSON from the response
    let recommendations;
    try {
      recommendations = JSON.parse(content);
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
                        content.match(/```\n([\s\S]*?)\n```/) ||
                        content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON from response');
      }
    }
    
    return (recommendations.movies || []).map(movie => ({
      ...movie,
      source: 'Claude'
    }));
  } catch (error) {
    console.error('Error fetching Claude recommendations:', error);
    return [];
  }
};

/**
 * Fetch movie recommendations from Gemini
 * @param {string} prompt - User's movie vibe description
 * @returns {Promise<Array>} - Array of movie recommendations
 */
export const fetchGeminiRecommendations = async (prompt) => {
  try {
    console.log('Making Gemini request with API key:', OPENROUTER_API_KEY ? 'Present' : 'Missing');
    
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: 'google/gemini-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a movie recommendation expert. Provide exactly 5 movie recommendations based on the user\'s description. For each movie, include the title, year, and a brief summary. Return your response as a JSON object with a "movies" array containing objects with "title", "year", and "summary" fields.'
          },
          {
            role: 'user',
            content: `Recommend movies with this vibe: ${prompt}`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3001',
          'X-Title': 'Triple Feature Movie Recommendations'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    console.log('Gemini Response:', content);
    
    // Try to parse JSON from the response
    let recommendations;
    try {
      recommendations = JSON.parse(content);
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
                        content.match(/```\n([\s\S]*?)\n```/) ||
                        content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON from response');
      }
    }
    
    return (recommendations.movies || []).map(movie => ({
      ...movie,
      source: 'Gemini'
    }));
  } catch (error) {
    console.error('Error fetching Gemini recommendations:', error);
    return [];
  }
};

/**
 * Fetch movie recommendations from all AI models and merge results
 * @param {string} prompt - User's movie vibe description
 * @returns {Promise<Array>} - Array of movie recommendations from all sources
 */
export const fetchMovieRecommendations = async (prompt) => {
  try {
    const promises = [
      fetchGptRecommendations(prompt),
      fetchClaudeRecommendations(prompt),
      fetchGeminiRecommendations(prompt)
    ];
    
    // Fetch recommendations from all models in parallel
    const results = await Promise.all(promises);
    
    // Combine all results
    const allRecommendations = results.flat();
    
    // Remove duplicates (same title)
    const uniqueMovies = [];
    const seenTitles = new Set();
    
    allRecommendations.forEach(movie => {
      const normalizedTitle = movie.title.toLowerCase();
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        uniqueMovies.push(movie);
      }
    });
    
    // Sort by relevance (for now, just randomize as a placeholder)
    return uniqueMovies.sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error('Error fetching movie recommendations:', error);
    return [];
  }
};