import React, { useState } from 'react';
import './MovieCard.css';

const MovieCard = ({ movie }) => {
  const [showTrailer, setShowTrailer] = useState(false);
  
  // Streaming platforms the movie might be available on
  const streamingPlatforms = movie.streamingPlatforms || [];
  
  // Function to get YouTube embed URL from movie trailer link
  const getYouTubeEmbedUrl = (trailerUrl) => {
    if (!trailerUrl) return null;
    
    // Extract YouTube video ID
    const videoIdMatch = trailerUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return videoIdMatch ? `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1` : null;
  };
  
  // Handle poster click to show trailer
  const handlePosterClick = () => {
    if (movie.trailerUrl) {
      setShowTrailer(true);
    }
  };
  
  // Close trailer modal
  const closeTrailer = () => {
    setShowTrailer(false);
  };

  return (
    <div className="movie-card">
      <div className="movie-poster-container">
        {/* Movie poster (clickable if trailer available) */}
        <img 
          src={movie.posterUrl || '/images/poster-placeholder.jpg'} 
          alt={`${movie.title} poster`}
          className={`movie-poster ${movie.trailerUrl ? 'has-trailer' : ''}`}
          onClick={handlePosterClick}
        />
        
        {/* Play button overlay if trailer is available */}
        {movie.trailerUrl && (
          <div className="play-button-overlay" onClick={handlePosterClick}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="movie-info">
        <h3 className="movie-title">{movie.title}</h3>
        <p className="movie-year">{movie.year}</p>
        <p className="movie-summary">{movie.summary}</p>
        
        {/* Streaming availability */}
        {streamingPlatforms.length > 0 && (
          <div className="streaming-platforms">
            <p>Available on:</p>
            <div className="platform-badges">
              {streamingPlatforms.map((platform) => (
                <span
                  key={platform.id}
                  className={`platform-badge platform-${platform.id}`}
                  title={platform.name}
                >
                  {platform.name}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Wiki button */}
        {movie.wikiUrl && (
          <a 
            href={movie.wikiUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="wiki-button"
          >
            Wiki
          </a>
        )}
        
        {/* AI source badge */}
        {movie.source && (
          <div className="ai-source-badge">
            Recommended by {movie.source}
          </div>
        )}
      </div>
      
      {/* Trailer modal */}
      {showTrailer && (
        <div className="trailer-modal">
          <div className="trailer-content">
            <button className="close-trailer" onClick={closeTrailer}>×</button>
            <iframe
              src={getYouTubeEmbedUrl(movie.trailerUrl)}
              title={`${movie.title} trailer`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieCard;