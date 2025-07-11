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
export const searchMovie = async (title, year = null) => {
  try {
    const params = {
      api_key: TMDB_API_KEY,
      query: title,
      include_adult: false,
      language: 'en-US',
      page: 1
    };
    
    // Add year parameter if provided
    if (year) {
      params.year = year;
    }
    
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, { params });
    
    // Log the number of results
    console.log(`TMDB search for "${title}"${year ? ` (${year})` : ''} returned ${response.data.results.length} results`);
    
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
 * Fetch complete movie details from title and optional year
 * @param {string} title - Movie title from AI recommendation
 * @param {number|string} [year] - Optional year to filter results
 * @returns {Promise<Object>} - Complete movie details
 */
// Cache for movie details to avoid redundant API calls
const movieDetailsCache = new Map();

// Function to create a promise with timeout
const promiseWithTimeout = (promise, timeoutMs) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => clearTimeout(timeoutId));
};

export const fetchMovieDetails = async (title, year = null) => {
  try {
    // Create a cache key from title and year
    const cacheKey = `${title}${year ? `-${year}` : ''}`;
    
    // Check if we already have this movie in cache
    if (movieDetailsCache.has(cacheKey)) {
      console.log(`Using cached details for: "${title}"${year ? ` (${year})` : ''}`);
      return movieDetailsCache.get(cacheKey);
    }
    
    console.log(`Fetching details for: "${title}"${year ? ` (${year})` : ''}`);
    
    // Search for the movie by title and year if provided with timeout
    const searchResults = await promiseWithTimeout(
      searchMovie(title, year),
      5000 // 5 second timeout
    );
    
    if (searchResults.length === 0) {
      console.log(`No TMDB results found for: ${title}`);
      
      // Create a more informative fallback with the original summary if available
      const fallbackResult = {
        title,
        posterUrl: null,
        year: year || 'Unknown',
        // Use the original summary from AI if available, otherwise a better fallback message
        summary: 'This movie was recommended based on your search criteria, but additional details could not be found in our database.',
        trailerUrl: null,
        wikiUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}${year ? `_(${year}_film)` : ''}`,
        streamingPlatforms: []
      };
      
      // Cache the fallback result
      movieDetailsCache.set(cacheKey, fallbackResult);
      return fallbackResult;
    }
    
    // Filter results by year if provided
    let filteredResults = searchResults;
    if (year) {
      const yearStr = String(year);
      filteredResults = searchResults.filter(movie =>
        movie.release_date && movie.release_date.startsWith(yearStr)
      );
      
      // If no movies match the exact year, fall back to all results
      if (filteredResults.length === 0) {
        console.log(`No exact year match for ${title} (${year}), using best match`);
        filteredResults = searchResults;
      }
    }
    
    // Get the first (most relevant) result
    const movie = filteredResults[0];
    console.log(`Best match: ${movie.title} (${movie.release_date?.substring(0, 4) || 'Unknown'})`);
    
    // Fetch all additional data in parallel with Promise.allSettled to prevent one failure from blocking all
    const [detailsResult, videosResult, streamingResult] = await Promise.allSettled([
      promiseWithTimeout(getMovieDetails(movie.id), 4000),
      promiseWithTimeout(getMovieVideos(movie.id), 4000),
      promiseWithTimeout(getStreamingAvailability(movie.id), 3000)
    ]);
    
    // Extract results or use fallbacks
    const details = detailsResult.status === 'fulfilled' ? detailsResult.value : null;
    const videos = videosResult.status === 'fulfilled' ? videosResult.value : [];
    const streamingPlatforms = streamingResult.status === 'fulfilled' ? streamingResult.value : [];
    
    // Find trailer if videos were successfully fetched
    const trailer = videos.find(video => video.type === 'Trailer' && video.site === 'YouTube');
    
    // Construct Wikipedia URL
    const movieYear = movie.release_date ? movie.release_date.substring(0, 4) : year;
    const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(movie.title.replace(/\s+/g, '_'))}${movieYear ? `_(${movieYear}_film)` : ''}`;
    
    // Construct result object
    const result = {
      id: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : null,
      year: movie.release_date ? movie.release_date.substring(0, 4) : (year || 'Unknown'),
      summary: movie.overview || details?.overview || 'No summary available',
      trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
      wikiUrl,
      streamingPlatforms
    };
    
    // Cache the result
    movieDetailsCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching movie details:', error);
    
    // Improved error fallback with better formatting
    const errorResult = {
      title,
      posterUrl: null,
      year: year || 'Unknown',
      summary: 'This movie was recommended based on your search criteria, but we encountered an error while retrieving additional details.',
      trailerUrl: null,
      wikiUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}${year ? `_(${year}_film)` : ''}`,
      streamingPlatforms: []
    };
    
    // Cache the error result
    movieDetailsCache.set(cacheKey, errorResult);
    return errorResult;
  }
};