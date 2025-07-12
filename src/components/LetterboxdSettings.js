import React, { useState, useEffect } from 'react';
import './LetterboxdSettings.css';
import {
  loadLetterboxdProfile,
  saveLetterboxdProfile,
  clearLetterboxdProfile,
  importLetterboxdCSV
} from '../services/letterboxdService';
import letterboxdLogo from '../assets/Letterboxd-Logo-H-Pos-RGB.svg.png';

const LetterboxdSettings = ({ isOpen, onClose, onProfileUpdate }) => {
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [showImportGuide, setShowImportGuide] = useState(false);

  useEffect(() => {
    // Load existing profile on component mount
    const existingProfile = loadLetterboxdProfile();
    setProfile(existingProfile);
    if (existingProfile.username) {
      setUsername(existingProfile.username);
    }
  }, [isOpen]);

  const handleCSVImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus('Importing your Letterboxd data...');

    try {
      const csvText = await file.text();
      const importedProfile = await importLetterboxdCSV(csvText);
      
      // Save the imported profile
      saveLetterboxdProfile(importedProfile);
      setProfile(importedProfile);
      
      setImportStatus(`Successfully imported ${importedProfile.stats.totalFilms} movies!`);
      
      // Notify parent component about profile update
      if (onProfileUpdate) {
        onProfileUpdate(importedProfile);
      }
      
      setTimeout(() => {
        setImportStatus('');
        setIsImporting(false);
      }, 3000);
    } catch (error) {
      console.error('Error importing CSV:', error);
      setImportStatus('Error importing file. Please check the format and try again.');
      setTimeout(() => {
        setImportStatus('');
        setIsImporting(false);
      }, 3000);
    }
  };

  const handleClearProfile = () => {
    if (window.confirm('Are you sure you want to clear your Letterboxd profile? This will remove all imported data.')) {
      clearLetterboxdProfile();
      setProfile(null);
      setUsername('');
      
      // Notify parent component about profile update
      if (onProfileUpdate) {
        onProfileUpdate(null);
      }
    }
  };

  const handleUsernameChange = (e) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    
    // Update profile with new username
    if (profile) {
      const updatedProfile = { ...profile, username: newUsername };
      setProfile(updatedProfile);
      saveLetterboxdProfile(updatedProfile);
      
      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="letterboxd-settings-overlay">
      <div className="letterboxd-settings-modal">
        <div className="letterboxd-settings-header">
          <img
            src={letterboxdLogo}
            alt="Letterboxd"
            className="letterboxd-logo-header"
          />
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="letterboxd-settings-content">
          {profile && profile.stats.totalFilms > 0 ? (
            <div className="profile-summary">
              <h3>Your Letterboxd Profile</h3>
              <div className="profile-stats">
                <div className="stat">
                  <span className="stat-number">{profile.stats.totalFilms}</span>
                  <span className="stat-label">Films Watched</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{profile.stats.totalRatings}</span>
                  <span className="stat-label">Ratings</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{profile.stats.averageRating}</span>
                  <span className="stat-label">Avg Rating</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{profile.watchlist.length}</span>
                  <span className="stat-label">Watchlist</span>
                </div>
              </div>
              
              {profile.topGenres.length > 0 && (
                <div className="top-genres">
                  <h4>Top Genres</h4>
                  <div className="genre-tags">
                    {profile.topGenres.slice(0, 5).map((genre, index) => (
                      <span key={index} className="genre-tag">{genre}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {profile.favoriteDirectors.length > 0 && (
                <div className="favorite-directors">
                  <h4>Favorite Directors</h4>
                  <div className="director-list">
                    {profile.favoriteDirectors.slice(0, 3).join(', ')}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="import-section">
              <h3>Import Your Letterboxd Data</h3>
              <p>Connect your Letterboxd viewing history to get personalized recommendations!</p>
              
              <div className="import-options">
                <div className="import-option">
                  <h4>Import from CSV Export</h4>
                  <p>Export your data from Letterboxd and import it here for instant personalization.</p>
                  
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVImport}
                      disabled={isImporting}
                      id="csv-import"
                    />
                    <label htmlFor="csv-import" className="file-input-label">
                      {isImporting ? 'Importing...' : 'Choose CSV File'}
                    </label>
                  </div>
                  
                  <button 
                    className="guide-button"
                    onClick={() => setShowImportGuide(!showImportGuide)}
                  >
                    {showImportGuide ? 'Hide' : 'Show'} Export Guide
                  </button>
                  
                  {showImportGuide && (
                    <div className="import-guide">
                      <h5>How to export from Letterboxd:</h5>
                      <ol>
                        <li>Go to <a href="https://letterboxd.com/data/" target="_blank" rel="noopener noreferrer">letterboxd.com/data/</a></li>
                        <li>Click "Export your data"</li>
                        <li>Wait for the email with your export file</li>
                        <li>Download and select the "diary.csv" or "watched.csv" file</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="username-section">
            <h4>Letterboxd Username (Optional)</h4>
            <input
              type="text"
              placeholder="Enter your Letterboxd username"
              value={username}
              onChange={handleUsernameChange}
              className="username-input"
            />
            <p className="username-note">
              This helps create links to your Letterboxd profile and reviews.
            </p>
          </div>
          
          {importStatus && (
            <div className={`import-status ${importStatus.includes('Error') ? 'error' : 'success'}`}>
              {importStatus}
            </div>
          )}
          
          <div className="settings-actions">
            {profile && profile.stats.totalFilms > 0 && (
              <button 
                className="clear-button"
                onClick={handleClearProfile}
              >
                Clear Profile Data
              </button>
            )}
            
            <button className="done-button" onClick={onClose}>
              Done
            </button>
          </div>
          
          <div className="letterboxd-info">
            <p>
              <strong>How this improves your recommendations:</strong>
            </p>
            <ul>
              <li>🚫 Excludes movies you've already watched</li>
              <li>🎯 Prioritizes genres and directors you enjoy</li>
              <li>⭐ Considers your rating patterns for better suggestions</li>
              <li>📚 Suggests movies from your watchlist when relevant</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LetterboxdSettings;