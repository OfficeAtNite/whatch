import React, { useState } from 'react';
import './MovieCard.css';

const MovieCard = ({ movie }) => {
  const [showTrailer, setShowTrailer] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // Ensure movie object has all required properties with fallbacks
  const safeMovie = {
    title: movie.title || 'Unknown Title',
    year: movie.year || 'Unknown Year',
    summary: movie.summary || 'No summary available',
    posterUrl: movie.posterUrl || movie.poster || null,
    trailerUrl: movie.trailerUrl || movie.trailer || null,
    wikiUrl: movie.wikiUrl || movie.wikipediaUrl || null,
    streamingPlatforms: movie.streamingPlatforms || movie.streamingProviders || [],
    source: movie.source || 'AI',
    justwatchUrl: movie.justwatchUrl || null,
    rating: movie.rating || null,
    genres: movie.genres || []
  };
  
  // Streaming platforms the movie might be available on
  const streamingPlatforms = safeMovie.streamingPlatforms;
  
  // Function to get YouTube embed URL from movie trailer link
  const getYouTubeEmbedUrl = (trailerUrl) => {
    if (!trailerUrl) return null;
    
    // Extract YouTube video ID
    const videoIdMatch = trailerUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return videoIdMatch ? `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1` : null;
  };
  
  // Handle image loading errors
  const handleImageError = () => {
    setImageError(true);
  };
  
  // Handle poster click to show trailer
  const handlePosterClick = () => {
    if (safeMovie.trailerUrl) {
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
          src={imageError ? 'https://placehold.co/300x450/1a1a1a/ffffff?text=Movie+Poster' : (safeMovie.posterUrl || 'https://placehold.co/300x450/1a1a1a/ffffff?text=Movie+Poster')}
          alt={`${safeMovie.title} poster`}
          className={`movie-poster ${safeMovie.trailerUrl ? 'has-trailer' : ''}`}
          onClick={handlePosterClick}
          onError={handleImageError}
        />
        
        {/* Play button overlay if trailer is available */}
        {safeMovie.trailerUrl && (
          <div className="play-button-overlay" onClick={handlePosterClick}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="movie-info">
        <h3 className="movie-title">{safeMovie.title}</h3>
        <p className="movie-year">{safeMovie.year}</p>
        
        {/* Display genres if available */}
        {safeMovie.genres && safeMovie.genres.length > 0 && (
          <p className="movie-genres">
            {safeMovie.genres.slice(0, 3).join(', ')}
          </p>
        )}
        
        {/* Display rating if available */}
        {safeMovie.rating && (
          <p className="movie-rating">
            Rating: {safeMovie.rating.toFixed(1)}/10
          </p>
        )}
        
        <div className="movie-summary-container">
          <p className={`movie-summary ${showFullDescription ? 'expanded' : ''}`}>
            {safeMovie.summary}
          </p>
          {safeMovie.summary.length > 150 && (
            <button
              className="show-more-button"
              onClick={() => setShowFullDescription(!showFullDescription)}
            >
              {showFullDescription ? 'Show Less' : 'Show More'}
            </button>
          )}
        </div>
        
        {/* Streaming availability */}
        {streamingPlatforms.length > 0 && (
          <div className="streaming-platforms">
            <p>Available on:</p>
            <div className="platform-badges">
              {streamingPlatforms.map((platform, index) => (
                <span
                  key={index}
                  className={`platform-badge platform-${platform.name.toLowerCase().replace(/\s+/g, '-')}`}
                  title={`${platform.name} (${platform.type || 'stream'})`}
                >
                  {platform.name}
                  {platform.type && <small className="provider-type">{platform.type}</small>}
                </span>
              ))}
            </div>
            {movie.justwatchUrl && (
              <a
                href={movie.justwatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="justwatch-link"
              >
                View all options on JustWatch
              </a>
            )}
          </div>
        )}
        
        {/* Wiki button */}
        {safeMovie.wikiUrl && (
          <a
            href={safeMovie.wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="wiki-button"
          >
            Wiki
          </a>
        )}
        
        {/* AI source badge */}
        {safeMovie.source && (
          <div className="ai-source-badge">
            Recommended by {safeMovie.source}
          </div>
        )}
      </div>
      
      {/* Trailer modal */}
      {showTrailer && safeMovie.trailerUrl && (
        <div className="trailer-modal">
          <div className="trailer-content">
            <button className="close-trailer" onClick={closeTrailer}>×</button>
            <iframe
              src={getYouTubeEmbedUrl(safeMovie.trailerUrl)}
              title={`${safeMovie.title} trailer`}
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