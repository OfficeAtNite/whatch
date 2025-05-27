import axios from 'axios';

// TMDB API key from environment variables
const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;

// Base URLs for API requests
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

/**
 * Search for a movie by title
 * @param {string} title - Movie title to search for
 * @returns {Promise<Object>} - Movie search results
 */
export const searchMovie = async (title) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: title,
        include_adult: false,
        language: 'en-US',
        page: 1
      }
    });
    
    return response.data.results;
  } catch (error) {
    console.error('Error searching for movie:', error);
    return [];
  }
};

/**
 * Get detailed information about a movie by ID
 * @param {number} movieId - TMDB movie ID
 * @returns {Promise<Object>} - Detailed movie information
 */
export const getMovieDetails = async (movieId) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
      params: {
        api_key: TMDB_API_KEY,
        append_to_response: 'videos,external_ids',
        language: 'en-US'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting movie details:', error);
    return null;
  }
};

/**
 * Get movie videos (trailers, teasers, etc.)
 * @param {number} movieId - TMDB movie ID
 * @returns {Promise<Array>} - Array of video objects
 */
export const getMovieVideos = async (movieId) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}/videos`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US'
      }
    });
    
    return response.data.results;
  } catch (error) {
    console.error('Error getting movie videos:', error);
    return [];
  }
};

/**
 * Get streaming availability for a movie
 * Note: TMDB doesn't directly provide streaming info, so this is a placeholder
 * In a real app, you might use JustWatch API or a similar service
 * @param {number} movieId - TMDB movie ID
 * @returns {Promise<Array>} - Array of streaming platforms
 */
export const getStreamingAvailability = async (movieId) => {
  // This is a placeholder - in a real app, you'd integrate with JustWatch or similar
  // For now, return mock data
  return Promise.resolve([
    { id: 'netflix', name: 'Netflix' },
    { id: 'prime', name: 'Amazon Prime' },
    { id: 'hulu', name: 'Hulu' },
    { id: 'disney', name: 'Disney+' },
    { id: 'hbo', name: 'HBO Max' }
  ].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1));
};

/**
 * Fetch complete movie details from title
 * @param {string} title - Movie title from AI recommendation
 * @returns {Promise<Object>} - Complete movie details
 */
export const fetchMovieDetails = async (title) => {
  try {
    // Search for the movie by title
    const searchResults = await searchMovie(title);
    
    if (searchResults.length === 0) {
      return {
        title,
        posterUrl: null,
        year: 'Unknown',
        summary: 'No additional details found',
        trailerUrl: null,
        wikiUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        streamingPlatforms: []
      };
    }
    
    // Get the first (most relevant) result
    const movie = searchResults[0];
    
    // Get additional details
    const details = await getMovieDetails(movie.id);
    
    // Get videos to find trailer
    const videos = await getMovieVideos(movie.id);
    const trailer = videos.find(video => video.type === 'Trailer' && video.site === 'YouTube');
    
    // Get streaming availability
    const streamingPlatforms = await getStreamingAvailability(movie.id);
    
    // Construct Wikipedia URL
    const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(movie.title)}`;
    
    return {
      id: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : null,
      year: movie.release_date ? movie.release_date.substring(0, 4) : 'Unknown',
      summary: movie.overview || details?.overview || 'No summary available',
      trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
      wikiUrl,
      streamingPlatforms
    };
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return {
      title,
      posterUrl: null,
      year: 'Unknown',
      summary: 'Error fetching details',
      trailerUrl: null,
      wikiUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      streamingPlatforms: []
    };
  }
};