import React, { useEffect, useRef } from 'react';
import './VideoBackground.css';

// This component handles the fullscreen video background with TV static overlay
const VideoBackground = ({ isSearching }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.75; // Slow down video slightly for better background effect
      
      // Log video sources for debugging
      console.log('Video sources:');
      const sources = videoRef.current.querySelectorAll('source');
      sources.forEach(source => {
        console.log(`- Source: ${source.src}, Type: ${source.type}`);
        // Check if file exists
        fetch(source.src)
          .then(response => {
            if (response.ok) {
              console.log(`✅ File exists: ${source.src}`);
            } else {
              console.error(`❌ File not found: ${source.src}`);
            }
          })
          .catch(error => console.error(`Error checking file: ${source.src}`, error));
      });
      
      // Attempt to play the video with retry mechanism
      const playVideo = async () => {
        try {
          // Try to play the video
          console.log('Attempting to play video...');
          const playPromise = videoRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('✅ Video playing successfully');
              })
              .catch(error => {
                console.error('❌ Video play error:', error);
                // If autoplay is prevented, try again with user interaction simulation
                document.addEventListener('click', () => {
                  console.log('Attempting to play after user interaction...');
                  videoRef.current.play()
                    .then(() => console.log('✅ Video playing after click'))
                    .catch(e => console.error('❌ Play after click failed:', e));
                }, { once: true });
                
                // Add a class to ensure dark background is visible
                document.querySelector('.video-background').classList.add('video-error');
              });
          }
        } catch (error) {
          console.error('❌ Video playback error:', error);
          document.querySelector('.video-background').classList.add('video-error');
        }
      };
      
      // Define event handlers as named functions so they can be properly removed
      const handleLoadedData = () => {
        console.log('✅ Video data loaded successfully');
        playVideo();
      };
      
      const handleCanPlay = () => {
        console.log('✅ Video can play');
      };
      
      const handleError = (e) => {
        console.error('❌ Video loading error:', e);
        console.error('Video error code:', videoRef.current.error ? videoRef.current.error.code : 'unknown');
        // Add a class to the parent div to ensure dark background is visible
        document.querySelector('.video-background').classList.add('video-error');
      };
      
      // Add event listeners for video
      videoRef.current.addEventListener('loadeddata', handleLoadedData);
      videoRef.current.addEventListener('canplay', handleCanPlay);
      videoRef.current.addEventListener('error', handleError);
    }
    
    // Cleanup function
    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadeddata', handleLoadedData);
        videoRef.current.removeEventListener('canplay', handleCanPlay);
        videoRef.current.removeEventListener('error', handleError);
      }
    };
  }, []);

  return (
    <div className={`video-background ${isSearching ? 'searching' : ''}`}>
      {/* Main background video */}
      <video 
        ref={videoRef}
        autoPlay 
        loop 
        muted 
        playsInline
        className="fullscreen-video"
      >
        {/* 2025 Movie trailers background video with multiple fallbacks */}
        <source src="/whatch/videos/new-trailers-2025.mp4" type="video/mp4" />
        <source src="/whatch/videos/movie-trailers.mp4" type="video/mp4" />
        <source src="/whatch/videos/movie-trailers.webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>
      
      {/* TV static overlay effect */}
      <div className="tv-static-overlay"></div>
      
      {/* Darkening overlay that appears when searching */}
      <div className="darkening-overlay"></div>
    </div>
  );
};

export default VideoBackground;