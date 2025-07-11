import React, { useState, useEffect } from 'react';
import VideoBackground from './components/VideoBackground';
import SearchForm from './components/SearchForm';
import MovieList from './components/MovieList';
import ThemeToggle from './components/ThemeToggle';
import { fetchMovieRecommendations } from './services/aiService';
import { fetchMovieDetails } from './services/movieService';
import './App.css';

function App() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [excludedMovies, setExcludedMovies] = useState([]);

  // Set dark mode permanently on initial render
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Reset to home page
  const resetToHome = () => {
    setIsSearching(false);
    setSearchQuery('');
    setMovies([]);
    setIsLoading(false);
  };

  // Handle search submission
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
      
      // Get movie recommendations from AI models
      const recommendations = await fetchMovieRecommendations(query, exclude);
      
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
      
      if (exclude.length > 0) {
        // If this is "more recommendations", add to existing movies at the top
        setMovies(prevMovies => [...moviesWithDetails, ...prevMovies]);
        setExcludedMovies(prevExcluded => [...prevExcluded, ...exclude]);
      } else {
        // If this is a new search, replace movies
        setMovies(moviesWithDetails);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setMovies([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app dark">
      <VideoBackground isSearching={isSearching} />
      
      <div className="container">
        <div className={`search-container ${isSearching ? 'searching' : ''}`}>
          <SearchForm
            onSearch={handleSearch}
            isSearching={isSearching}
            onLogoClick={resetToHome}
          />
        </div>
        
        {isSearching && (
          <div className="results-container">
            {isLoading ? (
              <div className="loader-container">
                <div className="loader">Getting you something good to Whatch!</div>
              </div>
            ) : (
              <>
                <MovieList movies={movies} />
                
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
    </div>
  );
}

export default App;
