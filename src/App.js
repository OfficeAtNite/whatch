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
  const handleSearch = async (query) => {
    setSearchQuery(query);
    setIsSearching(true);
    setIsLoading(true);
    
    try {
      // Get movie recommendations from AI models
      const recommendations = await fetchMovieRecommendations(query);
      
      // Fetch additional details for each movie
      const moviesWithDetails = await Promise.all(
        recommendations.map(movie => fetchMovieDetails(movie.title))
      );
      
      setMovies(moviesWithDetails);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
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
                <div className="loader">Loading...</div>
              </div>
            ) : (
              <MovieList movies={movies} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
