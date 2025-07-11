import React, { useState } from 'react';
import './SearchForm.css';
import logo from '../assets/logo.png';

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
        <div
          className={`app-logo ${isSearching ? 'small' : ''} ${onLogoClick ? 'clickable' : ''}`}
          onClick={onLogoClick}
        >
          <img
            src={logo}
            alt="Whatch? Logo"
            className="logo-image"
          />
        </div>
        
        <div className="input-wrapper">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a movie vibe (e.g., 'adrenaline-pumping sci-fi heist from the 2010s')"
            className="search-input"
            aria-label="Movie vibe search"
          />
        </div>
        
        <button
          type="submit"
          className="search-button"
          disabled={!query.trim()}
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