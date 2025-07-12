/**
 * Letterboxd Service for fetching and parsing public user profile data
 * This service allows users to import their viewing history to personalize recommendations
 */

// Cache for Letterboxd profile data to avoid repeated requests
const profileCache = new Map();

/**
 * Parse public Letterboxd profile data from username
 * @param {string} username - Letterboxd username (without @)
 * @returns {Promise<Object>} - User's viewing data and preferences
 */
export const getLetterboxdProfile = async (username) => {
  try {
    console.log(`Fetching Letterboxd profile for: ${username}`);
    
    // Check cache first
    if (profileCache.has(username)) {
      console.log('Using cached Letterboxd profile data');
      return profileCache.get(username);
    }

    // Parse public profile data
    const profileData = await parseLetterboxdProfile(username);
    
    // Cache the result
    profileCache.set(username, profileData);
    
    return profileData;
  } catch (error) {
    console.error('Error fetching Letterboxd profile:', error);
    return getEmptyProfile();
  }
};

/**
 * Parse Letterboxd profile HTML to extract viewing data
 * @param {string} username - Letterboxd username
 * @returns {Promise<Object>} - Parsed profile data
 */
const parseLetterboxdProfile = async (username) => {
  try {
    // Since we can't directly scrape due to CORS, we'll use a proxy approach
    // For now, we'll return a structured format that could be populated
    // via browser extension or manual import
    
    console.log(`Parsing Letterboxd data for: ${username}`);
    
    // This would be where we'd make the actual request to parse profile data
    // For demonstration, we'll return a structure that represents what we'd extract
    
    const profileData = {
      username,
      lastUpdated: new Date().toISOString(),
      stats: {
        totalFilms: 0,
        totalRatings: 0,
        averageRating: 0
      },
      watchedMovies: [],
      ratings: new Map(), // title -> rating (1-5)
      watchlist: [],
      topGenres: [],
      favoriteDirectors: [],
      favoriteActors: [],
      recentlyWatched: []
    };

    // In a real implementation, this would parse the actual profile
    // For now, we return the empty structure
    return profileData;
  } catch (error) {
    console.error('Error parsing Letterboxd profile:', error);
    return getEmptyProfile();
  }
};

/**
 * Get empty profile structure
 * @returns {Object} - Empty profile data structure
 */
const getEmptyProfile = () => ({
  username: null,
  lastUpdated: null,
  stats: {
    totalFilms: 0,
    totalRatings: 0,
    averageRating: 0
  },
  watchedMovies: [],
  ratings: new Map(),
  watchlist: [],
  topGenres: [],
  favoriteDirectors: [],
  favoriteActors: [],
  recentlyWatched: []
});

/**
 * Manual import of Letterboxd data from CSV export
 * @param {string} csvData - CSV export from Letterboxd
 * @returns {Object} - Parsed profile data
 */
export const importLetterboxdCSV = async (csvData) => {
  try {
    console.log('Importing Letterboxd CSV data');
    
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const watchedMovies = [];
    const ratings = new Map();
    const watchlist = [];
    const genreCount = new Map();
    const directorCount = new Map();
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      if (values.length < headers.length) continue;
      
      const movie = {};
      headers.forEach((header, index) => {
        movie[header] = values[index] || '';
      });
      
      // Extract key data
      const title = movie['Name'] || movie['Title'];
      const year = movie['Year'];
      const rating = movie['Rating'] ? parseFloat(movie['Rating']) : null;
      const isWatchlist = movie['Watchlist'] === 'Yes';
      
      if (title) {
        const movieData = {
          title,
          year: year ? parseInt(year) : null,
          rating,
          dateWatched: movie['Watched Date'] || null,
          review: movie['Review'] || null
        };
        
        if (isWatchlist) {
          watchlist.push(movieData);
        } else if (movie['Watched Date']) {
          watchedMovies.push(movieData);
          
          if (rating) {
            ratings.set(title, rating);
          }
        }
        
        // Count genres (if available)
        const genres = movie['Genres'] || movie['Primary Language'];
        if (genres) {
          genres.split(',').forEach(genre => {
            const trimmedGenre = genre.trim();
            genreCount.set(trimmedGenre, (genreCount.get(trimmedGenre) || 0) + 1);
          });
        }
        
        // Count directors (if available)
        const directors = movie['Director(s)'] || movie['Directors'];
        if (directors) {
          directors.split(',').forEach(director => {
            const trimmedDirector = director.trim();
            directorCount.set(trimmedDirector, (directorCount.get(trimmedDirector) || 0) + 1);
          });
        }
      }
    }
    
    // Calculate statistics
    const totalRatings = ratings.size;
    const averageRating = totalRatings > 0 
      ? Array.from(ratings.values()).reduce((sum, rating) => sum + rating, 0) / totalRatings 
      : 0;
    
    // Get top genres and directors
    const topGenres = Array.from(genreCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre]) => genre);
    
    const favoriteDirectors = Array.from(directorCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([director]) => director);
    
    const profileData = {
      username: 'imported',
      lastUpdated: new Date().toISOString(),
      stats: {
        totalFilms: watchedMovies.length,
        totalRatings,
        averageRating: parseFloat(averageRating.toFixed(1))
      },
      watchedMovies,
      ratings,
      watchlist,
      topGenres,
      favoriteDirectors,
      favoriteActors: [], // Would need additional parsing for actors
      recentlyWatched: watchedMovies
        .filter(m => m.dateWatched)
        .sort((a, b) => new Date(b.dateWatched) - new Date(a.dateWatched))
        .slice(0, 20)
    };
    
    console.log(`Imported ${watchedMovies.length} watched movies, ${watchlist.length} watchlist items`);
    return profileData;
  } catch (error) {
    console.error('Error importing Letterboxd CSV:', error);
    return getEmptyProfile();
  }
};

/**
 * Parse a CSV line handling quoted values
 * @param {string} line - CSV line to parse
 * @returns {Array} - Array of values
 */
const parseCSVLine = (line) => {
  const values = [];
  let currentValue = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  values.push(currentValue.trim());
  return values;
};

/**
 * Save Letterboxd profile to localStorage
 * @param {Object} profileData - Profile data to save
 */
export const saveLetterboxdProfile = (profileData) => {
  try {
    // Convert Map to object for JSON storage
    const dataToSave = {
      ...profileData,
      ratings: Object.fromEntries(profileData.ratings)
    };
    
    localStorage.setItem('letterboxd_profile', JSON.stringify(dataToSave));
    console.log('Letterboxd profile saved to localStorage');
  } catch (error) {
    console.error('Error saving Letterboxd profile:', error);
  }
};

/**
 * Load Letterboxd profile from localStorage
 * @returns {Object} - Saved profile data or empty profile
 */
export const loadLetterboxdProfile = () => {
  try {
    const saved = localStorage.getItem('letterboxd_profile');
    if (!saved) return getEmptyProfile();
    
    const data = JSON.parse(saved);
    
    // Convert ratings object back to Map
    data.ratings = new Map(Object.entries(data.ratings || {}));
    
    console.log(`Loaded Letterboxd profile: ${data.stats.totalFilms} films`);
    return data;
  } catch (error) {
    console.error('Error loading Letterboxd profile:', error);
    return getEmptyProfile();
  }
};

/**
 * Clear stored Letterboxd profile
 */
export const clearLetterboxdProfile = () => {
  try {
    localStorage.removeItem('letterboxd_profile');
    profileCache.clear();
    console.log('Letterboxd profile cleared');
  } catch (error) {
    console.error('Error clearing Letterboxd profile:', error);
  }
};

/**
 * Check if a movie has been watched by the user
 * @param {string} title - Movie title to check
 * @param {Object} profileData - User's Letterboxd profile data
 * @returns {boolean} - True if movie has been watched
 */
export const hasWatchedMovie = (title, profileData) => {
  if (!profileData || !profileData.watchedMovies) return false;
  
  return profileData.watchedMovies.some(movie => 
    movie.title.toLowerCase() === title.toLowerCase()
  );
};

/**
 * Get user's rating for a movie
 * @param {string} title - Movie title
 * @param {Object} profileData - User's Letterboxd profile data
 * @returns {number|null} - Rating (1-5) or null if not rated
 */
export const getMovieRating = (title, profileData) => {
  if (!profileData || !profileData.ratings) return null;
  
  return profileData.ratings.get(title) || null;
};

/**
 * Generate AI prompt enhancement based on Letterboxd profile
 * @param {Object} profileData - User's Letterboxd profile data
 * @returns {string} - Additional context for AI recommendations
 */
export const generateProfileContext = (profileData) => {
  if (!profileData || profileData.stats.totalFilms === 0) {
    return '';
  }
  
  const context = [];
  
  // Add viewing statistics
  context.push(`User has watched ${profileData.stats.totalFilms} films`);
  
  if (profileData.stats.averageRating > 0) {
    context.push(`with an average rating of ${profileData.stats.averageRating}/5`);
  }
  
  // Add favorite genres
  if (profileData.topGenres.length > 0) {
    context.push(`Favorite genres: ${profileData.topGenres.slice(0, 3).join(', ')}`);
  }
  
  // Add favorite directors
  if (profileData.favoriteDirectors.length > 0) {
    context.push(`Frequently watched directors: ${profileData.favoriteDirectors.slice(0, 3).join(', ')}`);
  }
  
  // Add highly rated recent movies
  const highlyRated = profileData.recentlyWatched
    .filter(movie => movie.rating && movie.rating >= 4)
    .slice(0, 5)
    .map(movie => movie.title);
  
  if (highlyRated.length > 0) {
    context.push(`Recently enjoyed: ${highlyRated.join(', ')}`);
  }
  
  return context.length > 0 
    ? `\n\nUser's Letterboxd Profile Context:\n${context.join('. ')}.` 
    : '';
};