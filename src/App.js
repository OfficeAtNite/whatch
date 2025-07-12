import React, { useState, useEffect } from 'react';
import VideoBackground from './components/VideoBackground';
import SearchForm from './components/SearchForm';
import MovieList from './components/MovieList';
import ThemeToggle from './components/ThemeToggle';
import LetterboxdSettings from './components/LetterboxdSettings';
import { fetchMovieRecommendations } from './services/aiService';
import { fetchMovieDetails } from './services/movieService';
import { loadLetterboxdProfile, hasWatchedMovie, generateProfileContext } from './services/letterboxdService';
import letterboxdIcon from './assets/letterboxd-icon.png';
import './App.css';

function App() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [excludedMovies, setExcludedMovies] = useState([]);
  const [letterboxdProfile, setLetterboxdProfile] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Set dark mode permanently and load Letterboxd profile on initial render
  useEffect(() => {
    document.documentElement.classList.add('dark');
    
    // Load saved Letterboxd profile
    const profile = loadLetterboxdProfile();
    if (profile && profile.stats.totalFilms > 0) {
      setLetterboxdProfile(profile);
      console.log(`Loaded Letterboxd profile: ${profile.stats.totalFilms} films`);
    }
  }, []);

  // Reset to home page
  const resetToHome = () => {
    setIsSearching(false);
    setSearchQuery('');
    setMovies([]);
    setIsLoading(false);
  };

  // Handle search submission with Letterboxd integration
  const handleSearch = async (query, exclude = []) => {
    // Clear previous results and show loading state
    setSearchQuery(query);
    setIsSearching(true);
    setIsLoading(true);
    
    if (exclude.length === 0) {
      // If this is a new search (not "more recommendations"), clear movies
      setMovies([]);
      setExcludedMovies([]);
    }
    
    try {
      console.log('Searching for:', query);
      console.log('Excluding:', exclude.map(m => m.title).join(', '));
      
      // Add Letterboxd context to exclude watched movies and enhance prompt
      let enhancedExclude = [...exclude];
      let enhancedQuery = query;
      
      if (letterboxdProfile && letterboxdProfile.stats.totalFilms > 0) {
        // Add watched movies to exclusion list
        const watchedTitles = letterboxdProfile.watchedMovies.map(m => m.title);
        enhancedExclude = [...enhancedExclude, ...watchedTitles];
        
        // Enhance query with Letterboxd context
        const profileContext = generateProfileContext(letterboxdProfile);
        enhancedQuery = query + profileContext;
        
        console.log(`Using Letterboxd profile with ${letterboxdProfile.stats.totalFilms} watched movies`);
        console.log(`Enhanced exclusion list: ${enhancedExclude.length} movies`);
      }
      
      // Get movie recommendations from AI models
      const recommendations = await fetchMovieRecommendations(enhancedQuery, enhancedExclude);
      
      if (recommendations.length === 0) {
        console.log('No recommendations returned from AI');
        if (exclude.length === 0) {
          setMovies([]);
        }
        return;
      }
      
      console.log('Received recommendations:', recommendations.length);
      
      // Fetch additional details for each movie
      const moviesWithDetails = await Promise.all(
        recommendations.map(async movie => {
          try {
            const details = await fetchMovieDetails(movie.title, movie.year);
            return {
              ...movie,
              ...details
            };
          } catch (error) {
            console.error(`Error fetching details for ${movie.title}:`, error);
            return movie; // Return original if details fetch fails
          }
        })
      );
      
      console.log('Processed movies with details:', moviesWithDetails.length);
      
      // Filter out any movies the user has already watched (double-check)
      let filteredMovies = moviesWithDetails;
      if (letterboxdProfile && letterboxdProfile.stats.totalFilms > 0) {
        filteredMovies = moviesWithDetails.filter(movie =>
          !hasWatchedMovie(movie.title, letterboxdProfile)
        );
        console.log(`Filtered ${moviesWithDetails.length - filteredMovies.length} watched movies`);
      }
      
      if (exclude.length > 0) {
        // If this is "more recommendations", add to existing movies at the top
        setMovies(prevMovies => [...filteredMovies, ...prevMovies]);
        setExcludedMovies(prevExcluded => [...prevExcluded, ...exclude]);
      } else {
        // If this is a new search, replace movies
        setMovies(filteredMovies);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setMovies([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Letterboxd profile update
  const handleLetterboxdProfileUpdate = (newProfile) => {
    setLetterboxdProfile(newProfile);
    console.log('Letterboxd profile updated:', newProfile ? `${newProfile.stats.totalFilms} films` : 'cleared');
  };

  return (
    <div className="app dark">
      <VideoBackground isSearching={isSearching} />
      
      <div className="container">
        <div className={`search-container ${isSearching ? 'searching' : ''}`}>
          <div className="search-with-settings">
            <SearchForm
              onSearch={handleSearch}
              isSearching={isSearching}
              onLogoClick={resetToHome}
              letterboxdProfile={letterboxdProfile}
            />
            
            {/* Settings button */}
            <div className="settings-button-container">
              <button
                className="settings-button"
                onClick={() => setIsSettingsOpen(true)}
                title="Letterboxd Settings"
              >
                <img
                  src={letterboxdIcon}
                  alt="Letterboxd"
                  width="20"
                  height="20"
                />
              </button>
            </div>
          </div>
        </div>
        
        {isSearching && (
          <div className="results-container">
            {isLoading ? (
              <div className="loader-container">
                <div className="loader">Getting you something good to Whatch!</div>
              </div>
            ) : (
              <>
                <MovieList movies={movies} letterboxdProfile={letterboxdProfile} />
                
                {movies.length > 0 && (
                  <div className="more-recommendations">
                    <button
                      className="more-recommendations-button"
                      onClick={() => handleSearch(searchQuery, [...movies.map(m => m.title), ...excludedMovies])}
                      disabled={isLoading}
                    >
                      Get More Recommendations
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Letterboxd Settings Modal */}
      <LetterboxdSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onProfileUpdate={handleLetterboxdProfileUpdate}
      />
    </div>
  );
}

export default App;
