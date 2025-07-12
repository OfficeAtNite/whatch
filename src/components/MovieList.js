import React from 'react';
import MovieCard from './MovieCard';
import './MovieList.css';

const MovieList = ({ movies, letterboxdProfile = null }) => {
  // Group movies by AI model source
  const groupedMovies = movies.reduce((acc, movie) => {
    if (!acc[movie.source]) {
      acc[movie.source] = [];
    }
    acc[movie.source].push(movie);
    return acc;
  }, {});

  // If no movies are found
  if (movies.length === 0) {
    return (
      <div className="no-results">
        <h2>No movies found</h2>
        <p>Try a different search term or check back later.</p>
      </div>
    );
  }

  return (
    <div className="movie-list-container">
      <h2 className="results-title">Recommended Whatches</h2>
      
      {/* Display all movies in a responsive grid */}
      <div className="movie-grid">
        {movies.map((movie, index) => (
          <MovieCard
            key={`${movie.id || movie.title}-${index}`}
            movie={movie}
            letterboxdProfile={letterboxdProfile}
          />
        ))}
      </div>
      
      {/* Alternative: Display movies grouped by AI model */}
      {/*
      <div className="model-sections">
        {Object.entries(groupedMovies).map(([source, modelMovies]) => (
          <div key={source} className="model-section">
            <h3 className="model-title">{source} Recommendations</h3>
            <div className="model-movies">
              {modelMovies.map((movie, index) => (
                <MovieCard key={`${movie.id || movie.title}-${index}`} movie={movie} />
              ))}
            </div>
          </div>
        ))}
      </div>
      */}
    </div>
  );
};

export default MovieList;