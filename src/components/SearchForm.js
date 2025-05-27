import React, { useState } from 'react';
import './SearchForm.css';

const SearchForm = ({ onSearch, isSearching, onLogoClick }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className={`search-form-container ${isSearching ? 'searching' : ''}`}>
      <form onSubmit={handleSubmit} className="search-form">
        <h1
          className={`app-title ${isSearching ? 'small' : ''} ${onLogoClick ? 'clickable' : ''}`}
          onClick={onLogoClick}
        >
          Whatch<span className="title-accent">?</span>
        </h1>
        
        <div className="input-wrapper">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a movie vibe (e.g., 'adrenaline-pumping sci-fi heist from the 2010s')"
            className="search-input"
            aria-label="Movie vibe search"
            disabled={isSearching}
          />
        </div>
        
        <button 
          type="submit" 
          className="search-button"
          disabled={isSearching || !query.trim()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search Movies
        </button>

        {!isSearching && (
          <p className="search-hint">
            Tell us what you're in the mood for and we'll find the perfect movie
          </p>
        )}
      </form>
    </div>
  );
};

export default SearchForm;