const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3002',
    'https://officeatnite.github.io',
    'https://OfficeAtNite.github.io'
  ]
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Triple Feature Backend is running' });
});

// Debug endpoint to check environment variables
app.get('/api/debug', (req, res) => {
  res.json({
    hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
    hasTMDB: !!process.env.TMDB_API_KEY,
    hasGemini: !!process.env.GEMINI_API_KEY,
    openRouterLength: process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.length : 0,
    tmdbLength: process.env.TMDB_API_KEY ? process.env.TMDB_API_KEY.length : 0,
    geminiLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0
  });
});

// Movie recommendations endpoint
// Common movie abbreviations and nicknames
const movieAbbreviations = {
  'bttf': 'back to the future',
  'lotr': 'lord of the rings',
  'hp': 'harry potter',
  'sw': 'star wars',
  'mcu': 'marvel',
  'dceu': 'dc comics',
  'potc': 'pirates of the caribbean',
  'f&f': 'fast and furious',
  'f and f': 'fast and furious',
  'mi': 'mission impossible',
  'jp': 'jurassic park',
  'jw': 'jurassic world',
  'gotg': 'guardians of the galaxy',
  'iw': 'infinity war',
  'eg': 'endgame',
  'tdk': 'the dark knight',
  'rotk': 'return of the king',
  'fotr': 'fellowship of the ring',
  'tt': 'two towers',
  'aotc': 'attack of the clones',
  'rots': 'revenge of the sith',
  'tfa': 'the force awakens',
  'tlj': 'the last jedi',
  'tros': 'the rise of skywalker',
  'rogue 1': 'rogue one',
  'ij': 'indiana jones'
};

app.post('/api/recommendations', async (req, res) => {
  try {
    console.log('=== RECOMMENDATIONS ENDPOINT DEBUG ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User-Agent:', req.headers['user-agent']);
    console.log('Origin:', req.headers.origin);
    console.log('Referer:', req.headers.referer);
    
    const { prompt, exclude = [] } = req.body;
    
    console.log('Extracted prompt:', prompt);
    console.log('Extracted exclude:', exclude);
    console.log('Exclude type:', typeof exclude);
    console.log('Exclude array?', Array.isArray(exclude));
    
    if (!prompt) {
      console.log('ERROR: No prompt provided');
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('Fetching recommendations for:', prompt);
    if (exclude.length > 0) {
      console.log('Excluding:', exclude.join(', '));
    }

    // Check if this is an actor-based search
    const isActorSearch = prompt.toLowerCase().includes("starring") ||
                         prompt.toLowerCase().includes("with actor") ||
                         prompt.toLowerCase().includes("featuring") ||
                         prompt.toLowerCase().includes("movies with") ||
                         prompt.toLowerCase().includes("films with") ||
                         prompt.toLowerCase().includes("actor") ||
                         prompt.toLowerCase().includes("actress") ||
                         prompt.toLowerCase().includes("cast") ||
                         prompt.toLowerCase().includes("played by") ||
                         prompt.toLowerCase().includes("stars");
    
    // Check if this is a director-based search
    const isDirectorSearch = prompt.toLowerCase().includes("directed by") ||
                            prompt.toLowerCase().includes("director") ||
                            prompt.toLowerCase().includes("directed") ||
                            prompt.toLowerCase().includes("filmmaker") ||
                            prompt.toLowerCase().includes("made by");
    
    // Check if this is a studio/production company search
    const isStudioSearch = prompt.toLowerCase().includes("pixar") ||
                          prompt.toLowerCase().includes("disney") ||
                          prompt.toLowerCase().includes("marvel") ||
                          prompt.toLowerCase().includes("studio") ||
                          prompt.toLowerCase().includes("production") ||
                          prompt.toLowerCase().includes("movies by") ||
                          prompt.toLowerCase().includes("films by") ||
                          prompt.toLowerCase().includes("produced by") ||
                          prompt.toLowerCase().includes("warner") ||
                          prompt.toLowerCase().includes("universal") ||
                          prompt.toLowerCase().includes("paramount") ||
                          prompt.toLowerCase().includes("sony") ||
                          prompt.toLowerCase().includes("mgm") ||
                          prompt.toLowerCase().includes("20th century") ||
                          prompt.toLowerCase().includes("netflix") ||
                          prompt.toLowerCase().includes("hbo") ||
                          prompt.toLowerCase().includes("a24") ||
                          prompt.toLowerCase().includes("blumhouse") ||
                          prompt.toLowerCase().includes("dreamworks") ||
                          prompt.toLowerCase().includes("lucasfilm") ||
                          prompt.toLowerCase().includes("miramax");
    
    // Check if this is a direct title search (likely a specific movie or franchise)
    const isDirectTitleSearch = !isActorSearch && !isDirectorSearch && !isStudioSearch &&
                               !prompt.toLowerCase().includes("like") &&
                               !prompt.toLowerCase().includes("similar") &&
                               !prompt.toLowerCase().includes("recommend") &&
                               prompt.length < 50;
    
    // For actor-based searches or direct title searches, use different approaches
    let allRecommendations = [];
    
    if (isActorSearch) {
      console.log(`Actor-based search detected: "${prompt}". Using AI recommendations.`);
      
      // Extract potential actor name from the query
      let actorName = "";
      const starringMatch = prompt.match(/starring\s+([a-zA-Z\s\.]+)/i);
      const withActorMatch = prompt.match(/with\s+(?:actor|actress)\s+([a-zA-Z\s\.]+)/i);
      const featuringMatch = prompt.match(/featuring\s+([a-zA-Z\s\.]+)/i);
      const moviesWithMatch = prompt.match(/movies\s+with\s+([a-zA-Z\s\.]+)/i);
      const filmsWithMatch = prompt.match(/films\s+with\s+([a-zA-Z\s\.]+)/i);
      const actorMatch = prompt.match(/(?:actor|actress)\s+([a-zA-Z\s\.]+)/i);
      const playedByMatch = prompt.match(/played\s+by\s+([a-zA-Z\s\.]+)/i);
      const starsMatch = prompt.match(/stars\s+([a-zA-Z\s\.]+)/i);
      
      if (starringMatch) actorName = starringMatch[1].trim();
      else if (withActorMatch) actorName = withActorMatch[1].trim();
      else if (featuringMatch) actorName = featuringMatch[1].trim();
      else if (moviesWithMatch) actorName = moviesWithMatch[1].trim();
      else if (filmsWithMatch) actorName = filmsWithMatch[1].trim();
      else if (actorMatch) actorName = actorMatch[1].trim();
      else if (playedByMatch) actorName = playedByMatch[1].trim();
      else if (starsMatch) actorName = starsMatch[1].trim();
      
      // Clean up actor name - remove common words that might be captured
      actorName = actorName.replace(/\b(in|the|a|an|and|or|of|as|by|for|with|movies|films|starring)\b/gi, ' ')
                          .replace(/\s+/g, ' ')
                          .trim();
      
      console.log(`Extracted actor name: "${actorName}"`);
      
      // Try to search for movies by actor first
      if (actorName) {
        try {
          const actorMovies = await searchMoviesByActor(actorName);
          if (actorMovies && actorMovies.length > 0) {
            console.log(`Found ${actorMovies.length} movies starring ${actorName}`);
            allRecommendations = actorMovies;
          } else {
            console.log(`No movies found for actor ${actorName}, falling back to AI recommendations`);
            // Fall back to AI recommendations
            const promises = [
              Promise.race([
                fetchGptRecommendations(prompt, exclude),
                new Promise(resolve => setTimeout(() => resolve([]), 8000)) // 8 second timeout
              ]),
              Promise.race([
                fetchClaudeRecommendations(prompt, exclude),
                new Promise(resolve => setTimeout(() => resolve([]), 8000)) // 8 second timeout
              ]),
              Promise.race([
                fetchGeminiRecommendations(prompt, exclude),
                new Promise(resolve => setTimeout(() => resolve([]), 8000)) // 8 second timeout
              ])
            ];
            
            const results = await Promise.all(promises);
            allRecommendations = results.flat();
          }
        } catch (error) {
          console.error(`Error searching for movies by actor: ${error.message}`);
          // Fall back to AI recommendations
          const promises = [
            Promise.race([
              fetchGptRecommendations(prompt, exclude),
              new Promise(resolve => setTimeout(() => resolve([]), 8000)) // 8 second timeout
            ]),
            Promise.race([
              fetchClaudeRecommendations(prompt, exclude),
              new Promise(resolve => setTimeout(() => resolve([]), 8000)) // 8 second timeout
            ]),
            Promise.race([
              fetchGeminiRecommendations(prompt, exclude),
              new Promise(resolve => setTimeout(() => resolve([]), 8000)) // 8 second timeout
            ])
          ];
          
          const results = await Promise.all(promises);
          allRecommendations = results.flat();
        }
      } else {
        // If we couldn't extract an actor name, fall back to AI recommendations
        const promises = [
          Promise.race([
            fetchGptRecommendations(prompt, exclude),
            new Promise(resolve => setTimeout(() => resolve([]), 8000)) // 8 second timeout
          ]),
          Promise.race([
            fetchClaudeRecommendations(prompt, exclude),
            new Promise(resolve => setTimeout(() => resolve([]), 8000)) // 8 second timeout
          ]),
          Promise.race([
            fetchGeminiRecommendations(prompt, exclude),
            new Promise(resolve => setTimeout(() => resolve([]), 8000)) // 8 second timeout
          ])
        ];
        
        const results = await Promise.all(promises);
        allRecommendations = results.flat();
      }
      
    } else if (isDirectorSearch) {
      console.log(`Director-based search detected: "${prompt}". Searching for director movies.`);
      
      // Extract potential director name from the query
      let directorName = "";
      const directedByMatch = prompt.match(/directed\s+by\s+([a-zA-Z\s\.]+)/i);
      const directorMatch = prompt.match(/director\s+([a-zA-Z\s\.]+)/i);
      const madeByMatch = prompt.match(/made\s+by\s+([a-zA-Z\s\.]+)/i);
      const filmakerMatch = prompt.match(/filmmaker\s+([a-zA-Z\s\.]+)/i);
      
      if (directedByMatch) directorName = directedByMatch[1].trim();
      else if (directorMatch) directorName = directorMatch[1].trim();
      else if (madeByMatch) directorName = madeByMatch[1].trim();
      else if (filmakerMatch) directorName = filmakerMatch[1].trim();
      
      // Clean up director name
      directorName = directorName.replace(/\b(movies|films|directed|director|the|a|an|and|or|of|as|by|for|with)\b/gi, ' ')
                                .replace(/\s+/g, ' ')
                                .trim();
      
      console.log(`Extracted director name: "${directorName}"`);
      
      if (directorName) {
        try {
          const directorMovies = await searchMoviesByDirector(directorName);
          if (directorMovies && directorMovies.length > 0) {
            console.log(`Found ${directorMovies.length} movies directed by ${directorName}`);
            allRecommendations = directorMovies;
          } else {
            console.log(`No movies found for director ${directorName}, falling back to AI recommendations`);
            const promises = [
              Promise.race([
                fetchGptRecommendations(prompt, exclude),
                new Promise(resolve => setTimeout(() => resolve([]), 8000))
              ]),
              Promise.race([
                fetchClaudeRecommendations(prompt, exclude),
                new Promise(resolve => setTimeout(() => resolve([]), 8000))
              ]),
              Promise.race([
                fetchGeminiRecommendations(prompt, exclude),
                new Promise(resolve => setTimeout(() => resolve([]), 8000))
              ])
            ];
            const results = await Promise.all(promises);
            allRecommendations = results.flat();
          }
        } catch (error) {
          console.error(`Error searching for movies by director: ${error.message}`);
          const promises = [
            Promise.race([
              fetchGptRecommendations(prompt, exclude),
              new Promise(resolve => setTimeout(() => resolve([]), 8000))
            ]),
            Promise.race([
              fetchClaudeRecommendations(prompt, exclude),
              new Promise(resolve => setTimeout(() => resolve([]), 8000))
            ]),
            Promise.race([
              fetchGeminiRecommendations(prompt, exclude),
              new Promise(resolve => setTimeout(() => resolve([]), 8000))
            ])
          ];
          const results = await Promise.all(promises);
          allRecommendations = results.flat();
        }
      } else {
        const promises = [
          Promise.race([
            fetchGptRecommendations(prompt, exclude),
            new Promise(resolve => setTimeout(() => resolve([]), 8000))
          ]),
          Promise.race([
            fetchClaudeRecommendations(prompt, exclude),
            new Promise(resolve => setTimeout(() => resolve([]), 8000))
          ]),
          Promise.race([
            fetchGeminiRecommendations(prompt, exclude),
            new Promise(resolve => setTimeout(() => resolve([]), 8000))
          ])
        ];
        const results = await Promise.all(promises);
        allRecommendations = results.flat();
      }
      
    } else if (isStudioSearch) {
      console.log(`Studio-based search detected: "${prompt}". Searching for studio movies.`);
      
      // Extract studio/company name from the query
      let studioName = "";
      const studioKeywords = [
        'pixar', 'disney', 'marvel', 'warner', 'universal', 'paramount', 'sony',
        'mgm', '20th century', 'netflix', 'hbo', 'a24', 'blumhouse', 'dreamworks',
        'lucasfilm', 'miramax'
      ];
      
      const promptLower = prompt.toLowerCase();
      for (const keyword of studioKeywords) {
        if (promptLower.includes(keyword)) {
          studioName = keyword;
          break;
        }
      }
      
      // Also try to extract from patterns like "movies by X" or "produced by X"
      if (!studioName) {
        const moviesByMatch = prompt.match(/movies\s+by\s+([a-zA-Z\s&\.]+)/i);
        const filmsByMatch = prompt.match(/films\s+by\s+([a-zA-Z\s&\.]+)/i);
        const producedByMatch = prompt.match(/produced\s+by\s+([a-zA-Z\s&\.]+)/i);
        
        if (moviesByMatch) studioName = moviesByMatch[1].trim();
        else if (filmsByMatch) studioName = filmsByMatch[1].trim();
        else if (producedByMatch) studioName = producedByMatch[1].trim();
        
        if (studioName) {
          studioName = studioName.replace(/\b(movies|films|studio|production|company|the|a|an|and|or|of|as|by|for|with)\b/gi, ' ')
                                .replace(/\s+/g, ' ')
                                .trim();
        }
      }
      
      console.log(`Extracted studio name: "${studioName}"`);
      
      if (studioName) {
        try {
          const studioMovies = await searchMoviesByStudio(studioName);
          if (studioMovies && studioMovies.length > 0) {
            console.log(`Found ${studioMovies.length} movies from ${studioName}`);
            allRecommendations = studioMovies;
          } else {
            console.log(`No movies found for studio ${studioName}, falling back to AI recommendations`);
            const promises = [
              Promise.race([
                fetchGptRecommendations(prompt, exclude),
                new Promise(resolve => setTimeout(() => resolve([]), 8000))
              ]),
              Promise.race([
                fetchClaudeRecommendations(prompt, exclude),
                new Promise(resolve => setTimeout(() => resolve([]), 8000))
              ]),
              Promise.race([
                fetchGeminiRecommendations(prompt, exclude),
                new Promise(resolve => setTimeout(() => resolve([]), 8000))
              ])
            ];
            const results = await Promise.all(promises);
            allRecommendations = results.flat();
          }
        } catch (error) {
          console.error(`Error searching for movies by studio: ${error.message}`);
          const promises = [
            Promise.race([
              fetchGptRecommendations(prompt, exclude),
              new Promise(resolve => setTimeout(() => resolve([]), 8000))
            ]),
            Promise.race([
              fetchClaudeRecommendations(prompt, exclude),
              new Promise(resolve => setTimeout(() => resolve([]), 8000))
            ]),
            Promise.race([
              fetchGeminiRecommendations(prompt, exclude),
              new Promise(resolve => setTimeout(() => resolve([]), 8000))
            ])
          ];
          const results = await Promise.all(promises);
          allRecommendations = results.flat();
        }
      } else {
        const promises = [
          Promise.race([
            fetchGptRecommendations(prompt, exclude),
            new Promise(resolve => setTimeout(() => resolve([]), 8000))
          ]),
          Promise.race([
            fetchClaudeRecommendations(prompt, exclude),
            new Promise(resolve => setTimeout(() => resolve([]), 8000))
          ]),
          Promise.race([
            fetchGeminiRecommendations(prompt, exclude),
            new Promise(resolve => setTimeout(() => resolve([]), 8000))
          ])
        ];
        const results = await Promise.all(promises);
        allRecommendations = results.flat();
      }
      
    } else if (isDirectTitleSearch) {
      console.log(`Direct title search detected: "${prompt}". Adding franchise search.`);
      
      // Check if the prompt is a known abbreviation
      const promptLower = prompt.toLowerCase().trim();
      let searchTerm = prompt;
      
      // Check for exact abbreviation match
      if (movieAbbreviations[promptLower]) {
        searchTerm = movieAbbreviations[promptLower];
        console.log(`Abbreviation detected: "${promptLower}" -> "${searchTerm}"`);
      }
      // Check for partial abbreviation match
      else {
        // Split the prompt into words
        const words = promptLower.split(/\s+/);
        let foundAbbreviation = false;
        
        // Check if any word in the prompt is an abbreviation
        for (const word of words) {
          if (movieAbbreviations[word]) {
            searchTerm = movieAbbreviations[word];
            console.log(`Word abbreviation detected: "${word}" in "${promptLower}" -> "${searchTerm}"`);
            foundAbbreviation = true;
            break;
          }
        }
        
        // Only if we didn't find a whole word abbreviation, check for abbreviations as part of franchise names
        if (!foundAbbreviation) {
          // These are franchise-specific abbreviations that might be part of a larger phrase
          const franchiseAbbreviations = ['lotr', 'hp', 'sw', 'mcu', 'dceu', 'potc', 'f&f', 'gotg'];
          
          for (const abbr of franchiseAbbreviations) {
            if (promptLower.includes(abbr)) {
              searchTerm = movieAbbreviations[abbr];
              console.log(`Franchise abbreviation detected: "${abbr}" in "${promptLower}" -> "${searchTerm}"`);
              break;
            }
          }
        }
      }
      
      // First, try to find the franchise directly from TMDB
      const franchiseResults = await searchFranchise(searchTerm);
      
      if (franchiseResults.length > 0) {
        console.log(`Found ${franchiseResults.length} franchise movies for "${searchTerm}"`);
        allRecommendations = franchiseResults;
      } else {
        // If no franchise found, proceed with normal AI recommendations
        console.log(`No franchise found for "${searchTerm}", proceeding with AI recommendations`);
        
        // Fetch recommendations from all AI models in parallel with a timeout
        const promises = [
          Promise.race([
            fetchGptRecommendations(prompt, exclude),
            new Promise(resolve => setTimeout(() => resolve([]), 8000)) // 8 second timeout
          ]),
          Promise.race([
            fetchClaudeRecommendations(prompt, exclude),
            new Promise(resolve => setTimeout(() => resolve([]), 8000)) // 8 second timeout
          ]),
          Promise.race([
            fetchGeminiRecommendations(prompt, exclude),
            new Promise(resolve => setTimeout(() => resolve([]), 8000)) // 8 second timeout
          ])
        ];
        
        const results = await Promise.all(promises);
        allRecommendations = results.flat();
      }
    } else {
      // For regular recommendation searches, use all AI models
      console.log(`Regular recommendation search: "${prompt}"`);
      
      // Fetch recommendations from all AI models in parallel with a timeout
      const promises = [
        Promise.race([
          fetchGptRecommendations(prompt, exclude),
          new Promise(resolve => setTimeout(() => resolve([]), 8000)) // 8 second timeout
        ]),
        Promise.race([
          fetchClaudeRecommendations(prompt, exclude),
          new Promise(resolve => setTimeout(() => resolve([]), 8000)) // 8 second timeout
        ]),
        Promise.race([
          fetchGeminiRecommendations(prompt, exclude),
          new Promise(resolve => setTimeout(() => resolve([]), 8000)) // 8 second timeout
        ])
      ];
      
      const results = await Promise.all(promises);
      allRecommendations = results.flat();
    }
    
    console.log(`Got ${allRecommendations.length} total recommendations`);
    
    // Remove duplicates (same title)
    const uniqueMovies = [];
    const seenTitles = new Set();
    
    // Add excluded titles to the seen titles set
    // Handle both string arrays and movie object arrays
    exclude.forEach(item => {
      if (typeof item === 'string') {
        seenTitles.add(item.toLowerCase());
      } else if (typeof item === 'object' && item.title) {
        seenTitles.add(item.title.toLowerCase());
      }
    });
    
    console.log('Excluded titles:', Array.from(seenTitles));
    
    allRecommendations.forEach(movie => {
      const normalizedTitle = movie.title.toLowerCase();
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        uniqueMovies.push(movie);
      } else {
        console.log(`Skipping duplicate: ${movie.title}`);
      }
    });
    
    // Enhance movies with TMDB data (posters, trailers, etc.) with concurrency limit
    // Process in batches of 3 to avoid overwhelming the TMDB API
    const enhancedMovies = [];
    const batchSize = 3;
    
    for (let i = 0; i < uniqueMovies.length; i += batchSize) {
      const batch = uniqueMovies.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (movie) => {
        try {
          const tmdbData = await searchAndEnhanceMovie(movie.title, movie.year);
          
          // If TMDB data is empty or minimal, log it
          if (Object.keys(tmdbData).length <= 2) {
            console.log(`Limited TMDB data for ${movie.title}:`, tmdbData);
          }
          
          // Merge data, ensuring we have fallbacks for missing properties
          return {
            ...movie,
            ...tmdbData,
            // Ensure these fields always exist with fallbacks
            poster: tmdbData.poster || null,
            backdrop: tmdbData.backdrop || null,
            rating: tmdbData.rating || null,
            genres: tmdbData.genres || [],
            streamingProviders: tmdbData.streamingProviders || [],
            // Create a Wikipedia URL even if TMDB doesn't provide one
            wikipediaUrl: tmdbData.wikipediaUrl ||
              `https://en.wikipedia.org/wiki/${encodeURIComponent(movie.title.replace(/\s+/g, '_'))}${movie.year ? `_(${movie.year}_film)` : ''}`
          };
        } catch (error) {
          console.error(`Error enhancing movie ${movie.title}:`, error);
          // Return original with fallback data if enhancement fails
          return {
            ...movie,
            poster: null,
            backdrop: null,
            rating: null,
            genres: [],
            streamingProviders: [],
            wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(movie.title.replace(/\s+/g, '_'))}${movie.year ? `_(${movie.year}_film)` : ''}`
          };
          }
        })
      );
      enhancedMovies.push(...batchResults);
    }
    
    // Sort by relevance using our improved algorithm
    const sortedMovies = sortMoviesByRelevance(enhancedMovies, prompt);
    
    res.json({ movies: sortedMovies });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch movie recommendations' });
  }
});

// Movie details endpoint (proxy for TMDB)
app.get('/api/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tmdbApiKey = process.env.TMDB_API_KEY;
    
    if (!tmdbApiKey) {
      return res.status(500).json({ error: 'TMDB API key not configured' });
    }
    
    const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
      params: {
        api_key: tmdbApiKey,
        append_to_response: 'videos,credits'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

// Search movies endpoint (proxy for TMDB)
app.get('/api/search', async (req, res) => {
  try {
    const { query } = req.query;
    const tmdbApiKey = process.env.TMDB_API_KEY;
    
    if (!tmdbApiKey) {
      return res.status(500).json({ error: 'TMDB API key not configured' });
    }
    
    const response = await axios.get('https://api.themoviedb.org/3/search/movie', {
      params: {
        api_key: tmdbApiKey,
        query: query
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).json({ error: 'Failed to search movies' });
  }
});

// AI Service Functions (moved from frontend)
async function fetchGptRecommendations(prompt, exclude = []) {
  console.log(`[GPT] Starting recommendation request for: "${prompt}"`);
  console.log(`[GPT] Exclude array:`, exclude);
  
  try {
    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    
    if (!openrouterApiKey) {
      console.warn('[GPT] OpenRouter API key not found');
      return [];
    }
    
    console.log(`[GPT] API key found, length: ${openrouterApiKey.length}`);
    
    // Extract year from prompt if present
    const yearMatch = prompt.match(/\b(19\d{2}|20\d{2})\b/);
    const yearContext = yearMatch ?
      `Pay special attention to the year ${yearMatch[1]} mentioned in the query. The user specifically wants movies from ${yearMatch[1]}.` :
      '';

    // Create exclusion context if movies should be excluded
    // Make sure we're joining an array of strings
    const exclusionContext = exclude.length > 0 ?
      `Do NOT include these movies in your recommendations: ${exclude.join(', ')}. Provide completely different movies.` :
      '';

    console.log(`[GPT] Making API request to OpenRouter...`);
    
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a movie recommendation expert. Based on the user's description, recommend exactly 5 movies that match their vibe. ${yearContext}
${exclusionContext}

Return your response as a JSON object with this exact structure:
{
  "movies": [
    {
      "title": "Movie Title",
      "year": 2023,
      "summary": "Brief description of the movie and why it matches the vibe"
    }
  ]
}

Only return the JSON object, no additional text.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    }, {
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://officeatnite.github.io/whatch',
        'X-Title': 'Triple Feature'
      }
    });

    console.log(`[GPT] API response status: ${response.status}`);
    console.log(`[GPT] API response data structure:`, Object.keys(response.data));
    
    const content = response.data.choices[0]?.message?.content;
    console.log(`[GPT] Content extracted:`, content ? 'Found content' : 'No content');
    
    if (!content) {
      console.warn('[GPT] No content in response');
      return [];
    }

    const recommendations = JSON.parse(content);
    console.log(`[GPT] Parsed recommendations:`, recommendations);
    console.log(`[GPT] Movie count:`, recommendations.movies ? recommendations.movies.length : 0);
    
    const result = (recommendations.movies || []).map(movie => ({
      ...movie,
      source: 'GPT-4'
    }));
    
    console.log(`[GPT] Returning ${result.length} movies`);
    return result;
  } catch (error) {
    console.error('[GPT] Error fetching recommendations:', error.message);
    console.error('[GPT] Error response:', error.response?.data);
    console.error('[GPT] Error status:', error.response?.status);
    return [];
  }
}

async function fetchClaudeRecommendations(prompt, exclude = []) {
  try {
    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    
    if (!openrouterApiKey) {
      console.warn('OpenRouter API key not found');
      return [];
    }
    
    // Extract year from prompt if present
    const yearMatch = prompt.match(/\b(19\d{2}|20\d{2})\b/);
    const yearContext = yearMatch ?
      `Pay special attention to the year ${yearMatch[1]} mentioned in the query. The user specifically wants movies from ${yearMatch[1]}.` :
      '';

    // Create exclusion context if movies should be excluded
    // Make sure we're joining an array of strings
    const exclusionContext = exclude.length > 0 ?
      `Do NOT include these movies in your recommendations: ${exclude.join(', ')}. Provide completely different movies.` :
      '';

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        {
          role: 'system',
          content: `You are a movie recommendation expert. Based on the user's description, recommend exactly 5 movies that match their vibe. ${yearContext}
${exclusionContext}

Return your response as a JSON object with this exact structure:
{
  "movies": [
    {
      "title": "Movie Title",
      "year": 2023,
      "summary": "Brief description of the movie and why it matches the vibe"
    }
  ]
}

Only return the JSON object, no additional text.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    }, {
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://officeatnite.github.io/whatch',
        'X-Title': 'Triple Feature'
      }
    });

    const content = response.data.choices[0]?.message?.content;
    if (!content) return [];

    const recommendations = JSON.parse(content);
    return (recommendations.movies || []).map(movie => ({
      ...movie,
      source: 'Claude'
    }));
  } catch (error) {
    console.error('Error fetching Claude recommendations:', error);
    return [];
  }
}

async function fetchGeminiRecommendations(prompt, exclude = []) {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      console.warn('Gemini API key not found');
      return [];
    }
    
    // Extract year from prompt if present
    const yearMatch = prompt.match(/\b(19\d{2}|20\d{2})\b/);
    const yearContext = yearMatch ?
      `Pay special attention to the year ${yearMatch[1]} mentioned in the query. The user specifically wants movies from ${yearMatch[1]}.` :
      '';

    // Create exclusion context if movies should be excluded
    // Make sure we're joining an array of strings
    const exclusionContext = exclude.length > 0 ?
      `Do NOT include these movies in your recommendations: ${exclude.join(', ')}. Provide completely different movies.` :
      '';

    // Updated to use the correct Gemini API endpoint and model
    const response = await axios.post(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`, {
      contents: [{
        parts: [{
          text: `You are a movie recommendation expert. Based on the user's description: "${prompt}", recommend exactly 5 movies that match their vibe. ${yearContext}
${exclusionContext}

Return your response as a JSON object with this exact structure:
{
  "movies": [
    {
      "title": "Movie Title",
      "year": 2023,
      "summary": "Brief description of the movie and why it matches the vibe"
    }
  ]
}

Only return the JSON object, no additional text.`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      console.log('No content returned from Gemini API');
      return [];
    }

    try {
      const recommendations = JSON.parse(content);
      return (recommendations.movies || []).map(movie => ({
        ...movie,
        source: 'Gemini'
      }));
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      console.log('Raw Gemini response:', content);
      return [];
    }
  } catch (error) {
    console.error('Error fetching Gemini recommendations:', error);
    return [];
  }
}

// TMDB and JustWatch Enhancement Functions
async function searchAndEnhanceMovie(title, year) {
  try {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    
    if (!tmdbApiKey) {
      console.warn('TMDB API key not found');
      return {};
    }

    // Search for the movie on TMDB
    const searchResponse = await axios.get('https://api.themoviedb.org/3/search/movie', {
      params: {
        api_key: tmdbApiKey,
        query: title,
        year: year,
        include_adult: false,
        language: 'en-US'
      }
    });

    const searchResults = searchResponse.data.results;
    if (!searchResults || searchResults.length === 0) {
      return {};
    }

    // Get the first (most relevant) result
    const movie = searchResults[0];
    
    // Get detailed movie information including videos
    const detailsResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}`, {
      params: {
        api_key: tmdbApiKey,
        append_to_response: 'videos,external_ids,watch/providers'
      }
    });

    const movieDetails = detailsResponse.data;
    
    // Find YouTube trailer
    const trailer = movieDetails.videos?.results?.find(
      video => video.type === 'Trailer' && video.site === 'YouTube'
    );

    // Get streaming providers from TMDB's watch/providers endpoint
    // This data comes from JustWatch and is officially integrated with TMDB
    const streamingProviders = [];
    
    // Get US streaming options (subscription)
    const usSubscription = movieDetails['watch/providers']?.results?.US?.flatrate || [];
    usSubscription.forEach(provider => {
      streamingProviders.push({
        name: provider.provider_name,
        logo: `https://image.tmdb.org/t/p/w45${provider.logo_path}`,
        type: 'subscription'
      });
    });
    
    // Get US rental options
    const usRental = movieDetails['watch/providers']?.results?.US?.rent || [];
    usRental.forEach(provider => {
      // Only add if not already in the list
      if (!streamingProviders.some(p => p.name === provider.provider_name)) {
        streamingProviders.push({
          name: provider.provider_name,
          logo: `https://image.tmdb.org/t/p/w45${provider.logo_path}`,
          type: 'rent'
        });
      }
    });
    
    // Get US purchase options
    const usPurchase = movieDetails['watch/providers']?.results?.US?.buy || [];
    usPurchase.forEach(provider => {
      // Only add if not already in the list
      if (!streamingProviders.some(p => p.name === provider.provider_name)) {
        streamingProviders.push({
          name: provider.provider_name,
          logo: `https://image.tmdb.org/t/p/w45${provider.logo_path}`,
          type: 'buy'
        });
      }
    });

    // Get JustWatch URL if available
    const justwatchUrl = movieDetails['watch/providers']?.results?.US?.link || null;

    return {
      tmdbId: movie.id,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
      rating: movie.vote_average,
      voteCount: movie.vote_count,
      genres: movieDetails.genres?.map(g => g.name) || [],
      runtime: movieDetails.runtime,
      releaseDate: movie.release_date,
      overview: movie.overview || movieDetails.overview,
      trailer: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
      trailerKey: trailer?.key || null,
      imdbId: movieDetails.external_ids?.imdb_id,
      streamingProviders: streamingProviders,
      justwatchUrl: justwatchUrl,
      wikipediaUrl: movieDetails.external_ids?.imdb_id
        ? `https://en.wikipedia.org/wiki/${title.replace(/\s+/g, '_')}_${year ? `(${year}_film)` : '(film)'}`
        : null
    };
  } catch (error) {
    console.error('Error enhancing movie with TMDB data:', error);
    return {};
  }
}

// Search for franchise movies directly from TMDB
async function searchFranchise(title) {
  try {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    
    if (!tmdbApiKey) {
      console.warn('TMDB API key not found');
      return [];
    }
    
    // First, search for the movie to get potential franchise information
    const searchResponse = await axios.get('https://api.themoviedb.org/3/search/movie', {
      params: {
        api_key: tmdbApiKey,
        query: title,
        include_adult: false,
        language: 'en-US'
      }
    });
    
    if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
      console.log(`No results found for "${title}"`);
      return [];
    }
    
    // Get the first (most relevant) result
    const movie = searchResponse.data.results[0];
    console.log(`Best match for "${title}": ${movie.title} (${movie.id})`);
    
    // Check if this movie belongs to a collection
    const detailsResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}`, {
      params: {
        api_key: tmdbApiKey,
        append_to_response: 'belongs_to_collection'
      }
    });
    
    // If the movie belongs to a collection, get all movies in that collection
    if (detailsResponse.data.belongs_to_collection) {
      const collection = detailsResponse.data.belongs_to_collection;
      console.log(`Movie belongs to collection: ${collection.name} (${collection.id})`);
      
      // Get all movies in the collection
      const collectionResponse = await axios.get(`https://api.themoviedb.org/3/collection/${collection.id}`, {
        params: {
          api_key: tmdbApiKey
        }
      });
      
      if (collectionResponse.data.parts && collectionResponse.data.parts.length > 0) {
        console.log(`Found ${collectionResponse.data.parts.length} movies in collection`);
        
        // Convert collection movies to our format
        const franchiseMovies = await Promise.all(
          collectionResponse.data.parts.map(async (movie) => {
            // Get streaming providers for each movie
            const providersResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/watch/providers`, {
              params: {
                api_key: tmdbApiKey
              }
            });
            
            // Extract US streaming providers
            const streamingProviders = [];
            const usProviders = providersResponse.data.results?.US || {};
            
            // Add subscription providers
            if (usProviders.flatrate) {
              usProviders.flatrate.forEach(provider => {
                streamingProviders.push({
                  name: provider.provider_name,
                  logo: `https://image.tmdb.org/t/p/w45${provider.logo_path}`,
                  type: 'subscription'
                });
              });
            }
            
            // Add rental providers
            if (usProviders.rent) {
              usProviders.rent.forEach(provider => {
                if (!streamingProviders.some(p => p.name === provider.provider_name)) {
                  streamingProviders.push({
                    name: provider.provider_name,
                    logo: `https://image.tmdb.org/t/p/w45${provider.logo_path}`,
                    type: 'rent'
                  });
                }
              });
            }
            
            // Add purchase providers
            if (usProviders.buy) {
              usProviders.buy.forEach(provider => {
                if (!streamingProviders.some(p => p.name === provider.provider_name)) {
                  streamingProviders.push({
                    name: provider.provider_name,
                    logo: `https://image.tmdb.org/t/p/w45${provider.logo_path}`,
                    type: 'buy'
                  });
                }
              });
            }
            
            return {
              title: movie.title,
              year: movie.release_date ? movie.release_date.substring(0, 4) : 'Unknown',
              summary: movie.overview,
              source: 'Franchise',
              tmdbId: movie.id,
              poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
              backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
              rating: movie.vote_average,
              voteCount: movie.vote_count,
              streamingProviders: streamingProviders,
              justwatchUrl: usProviders.link || null
            };
          })
        );
        
        // Sort by release date (chronological order)
        return franchiseMovies.sort((a, b) => {
          // Try to sort by year
          if (a.year !== 'Unknown' && b.year !== 'Unknown') {
            return parseInt(a.year) - parseInt(b.year);
          }
          return 0;
        });
      }
    }
    
    // If no collection found, try to find movies with similar titles
    // This helps with franchises that don't have official collections in TMDB
    console.log(`No collection found for "${title}", searching for similar titles`);
    
    // Create a simplified version of the title for matching
    const simplifiedTitle = title.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
    
    // Common franchise indicators to remove for base title matching
    const franchiseIndicators = [
      'part', 'episode', 'chapter', 'volume', 'vol',
      'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'at',
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
      'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x',
      'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
      'trilogy', 'series'
    ];
    
    // Extract the base title (without numbers, roman numerals, etc.)
    let baseTitle = simplifiedTitle;
    franchiseIndicators.forEach(indicator => {
      // Remove the indicator if it's at the end of the title
      const regex = new RegExp(`\\s+${indicator}\\s*$`, 'i');
      baseTitle = baseTitle.replace(regex, '');
      
      // Remove the indicator if it's at the beginning of the title
      const regexStart = new RegExp(`^\\s*${indicator}\\s+`, 'i');
      baseTitle = baseTitle.replace(regexStart, '');
    });
    
    // Special case for titles with colons (often indicate sequels)
    baseTitle = baseTitle.split(':')[0].trim();
    
    // Special case for abbreviations
    for (const [abbr, fullName] of Object.entries(movieAbbreviations)) {
      if (title.toLowerCase() === abbr) {
        baseTitle = fullName;
        console.log(`Using full name for abbreviation: "${abbr}" -> "${baseTitle}"`);
        break;
      }
    }
    
    console.log(`Base title for franchise search: "${baseTitle}"`);
    
    // Search for movies with the base title
    // For better franchise detection, we'll search with a higher limit
    const franchiseSearchResponse = await axios.get('https://api.themoviedb.org/3/search/movie', {
      params: {
        api_key: tmdbApiKey,
        query: baseTitle,
        include_adult: false,
        language: 'en-US',
        page: 1,
        // Increase the number of results to ensure we catch all franchise entries
        per_page: 20
      }
    });
    
    if (!franchiseSearchResponse.data.results || franchiseSearchResponse.data.results.length === 0) {
      return [];
    }
    
    // Enhanced filter to better detect franchise movies
    const potentialFranchiseMovies = franchiseSearchResponse.data.results.filter(movie => {
      const movieTitle = movie.title.toLowerCase();
      
      // Check if this movie's title contains the base title
      const titleMatch = movieTitle.includes(baseTitle) || baseTitle.includes(movieTitle);
      
      // Special handling for numbered sequels (e.g., "Back to the Future Part III")
      const hasSequelIndicator =
        movieTitle.includes(baseTitle + ' ') && (
          movieTitle.includes(' part ') ||
          movieTitle.includes(' chapter ') ||
          /\b[0-9]+\b/.test(movieTitle) || // Has a number
          /\b(i{1,3}|iv|v|vi{1,3}|ix|x)\b/.test(movieTitle) // Has Roman numerals
        );
      
      // For short queries that might be abbreviations, check if the movie title contains words that start with the letters
      let abbreviationMatch = false;
      if (title.length <= 5) {
        // Check if the title could be an abbreviation (e.g., "LOTR" for "Lord of the Rings")
        const letters = title.toLowerCase().split('');
        const words = movieTitle.split(' ');
        
        // Check if the first letters of consecutive words match the abbreviation
        for (let i = 0; i <= words.length - letters.length; i++) {
          const matchingLetters = words.slice(i, i + letters.length)
            .map(word => word[0])
            .join('');
          
          if (matchingLetters === title.toLowerCase()) {
            abbreviationMatch = true;
            console.log(`Abbreviation match: "${title}" matches first letters of "${words.slice(i, i + letters.length).join(' ')}"`);
            break;
          }
        }
        
        // Special case for "bttf" -> "back to the future"
        if (title.toLowerCase() === 'bttf' && movieTitle.includes('back') && movieTitle.includes('future')) {
          abbreviationMatch = true;
          console.log(`Special abbreviation match: "bttf" matches "${movieTitle}"`);
        }
      }
      
      // Special case for Back to the Future trilogy
      if ((baseTitle.includes('back to the future') || title.toLowerCase() === 'bttf') &&
          movieTitle.includes('back to the future')) {
        console.log(`Back to the Future franchise match: "${movieTitle}"`);
        return true;
      }
      
      return titleMatch || abbreviationMatch || hasSequelIndicator;
    });
    
    console.log(`Found ${potentialFranchiseMovies.length} potential franchise movies for "${baseTitle}"`);
    
    // Convert to our format
    const franchiseMovies = await Promise.all(
      potentialFranchiseMovies.slice(0, 15).map(async (movie) => { // Increased limit to 15 movies
        // Get streaming providers for each movie
        const providersResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/watch/providers`, {
          params: {
            api_key: tmdbApiKey
          }
        });
        
        // Extract US streaming providers
        const streamingProviders = [];
        const usProviders = providersResponse.data.results?.US || {};
        
        // Add subscription providers
        if (usProviders.flatrate) {
          usProviders.flatrate.forEach(provider => {
            streamingProviders.push({
              name: provider.provider_name,
              logo: `https://image.tmdb.org/t/p/w45${provider.logo_path}`,
              type: 'subscription'
            });
          });
        }
        
        // Add rental providers
        if (usProviders.rent) {
          usProviders.rent.forEach(provider => {
            if (!streamingProviders.some(p => p.name === provider.provider_name)) {
              streamingProviders.push({
                name: provider.provider_name,
                logo: `https://image.tmdb.org/t/p/w45${provider.logo_path}`,
                type: 'rent'
              });
            }
          });
        }
        
        // Add purchase providers
        if (usProviders.buy) {
          usProviders.buy.forEach(provider => {
            if (!streamingProviders.some(p => p.name === provider.provider_name)) {
              streamingProviders.push({
                name: provider.provider_name,
                logo: `https://image.tmdb.org/t/p/w45${provider.logo_path}`,
                type: 'buy'
              });
            }
          });
        }
        
        return {
          title: movie.title,
          year: movie.release_date ? movie.release_date.substring(0, 4) : 'Unknown',
          summary: movie.overview,
          source: 'Franchise',
          tmdbId: movie.id,
          poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
          backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
          rating: movie.vote_average,
          voteCount: movie.vote_count,
          streamingProviders: streamingProviders,
          justwatchUrl: usProviders.link || null
        };
      })
    );
    
    // Sort by release date (chronological order)
    return franchiseMovies.sort((a, b) => {
      // Try to sort by year
      if (a.year !== 'Unknown' && b.year !== 'Unknown') {
        return parseInt(a.year) - parseInt(b.year);
      }
      return 0;
    });
  } catch (error) {
    console.error('Error searching for franchise:', error);
    return [];
  }
}

// Search for movies by actor using TMDB API
async function searchMoviesByActor(actorName) {
  try {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    
    if (!tmdbApiKey) {
      console.warn('TMDB API key not found');
      return [];
    }
    
    // First, search for the actor to get their ID
    const personSearchResponse = await axios.get('https://api.themoviedb.org/3/search/person', {
      params: {
        api_key: tmdbApiKey,
        query: actorName,
        include_adult: false,
        language: 'en-US'
      }
    });
    
    if (!personSearchResponse.data.results || personSearchResponse.data.results.length === 0) {
      console.log(`No actor found for "${actorName}"`);
      return [];
    }
    
    // Get the first (most relevant) actor result
    const actor = personSearchResponse.data.results[0];
    console.log(`Found actor: ${actor.name} (ID: ${actor.id})`);
    
    // Get movies the actor has been in
    const actorMoviesResponse = await axios.get(`https://api.themoviedb.org/3/person/${actor.id}/movie_credits`, {
      params: {
        api_key: tmdbApiKey,
        language: 'en-US'
      }
    });
    
    if (!actorMoviesResponse.data.cast || actorMoviesResponse.data.cast.length === 0) {
      console.log(`No movies found for actor ${actor.name}`);
      return [];
    }
    
    // Sort by popularity and take the top 10
    const topMovies = actorMoviesResponse.data.cast
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10);
    
    console.log(`Found ${topMovies.length} movies starring ${actor.name}`);
    
    // Convert to our format with streaming providers
    const actorMovies = await Promise.all(
      topMovies.map(async (movie) => {
        // Get streaming providers for each movie
        const providersResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/watch/providers`, {
          params: {
            api_key: tmdbApiKey
          }
        });
        
        // Extract US streaming providers
        const streamingProviders = [];
        const usProviders = providersResponse.data.results?.US || {};
        
        // Add subscription providers
        if (usProviders.flatrate) {
          usProviders.flatrate.forEach(provider => {
            streamingProviders.push({
              name: provider.provider_name,
              logo: `https://image.tmdb.org/t/p/w45${provider.logo_path}`,
              type: 'subscription'
            });
          });
        }
        
        // Add rental providers
        if (usProviders.rent) {
          usProviders.rent.forEach(provider => {
            if (!streamingProviders.some(p => p.name === provider.provider_name)) {
              streamingProviders.push({
                name: provider.provider_name,
                logo: `https://image.tmdb.org/t/p/w45${provider.logo_path}`,
                type: 'rent'
              });
            }
          });
        }
        
        // Add purchase providers
        if (usProviders.buy) {
          usProviders.buy.forEach(provider => {
            if (!streamingProviders.some(p => p.name === provider.provider_name)) {
              streamingProviders.push({
                name: provider.provider_name,
                logo: `https://image.tmdb.org/t/p/w45${provider.logo_path}`,
                type: 'buy'
              });
            }
          });
        }
        
        return {
          title: movie.title,
          year: movie.release_date ? movie.release_date.substring(0, 4) : 'Unknown',
          summary: movie.overview || `A movie starring ${actor.name}`,
          source: `Actor: ${actor.name}`,
          tmdbId: movie.id,
          poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
          backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
          rating: movie.vote_average,
          voteCount: movie.vote_count,
          streamingProviders: streamingProviders,
          justwatchUrl: usProviders.link || null
        };
      })
    );
    
    return actorMovies;
  } catch (error) {
    console.error('Error searching for movies by actor:', error);
    return [];
  }
}

// Enhanced movie sorting algorithm with relevance filtering
function sortMoviesByRelevance(movies, prompt) {
  // Convert prompt to lowercase for case-insensitive matching
  const promptLower = prompt.toLowerCase();
  
  // Check if this is a direct movie title search
  // This handles cases like "Back to the Future" where we want exact matches first
  const isDirectTitleSearch = !promptLower.includes("like") &&
                             !promptLower.includes("similar") &&
                             !promptLower.includes("recommend") &&
                             promptLower.length < 50; // Short queries are more likely to be direct title searches
  
  console.log(`Query "${prompt}" identified as direct title search: ${isDirectTitleSearch}`);
  
  // Extract potential keywords from the prompt
  const keywords = promptLower
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/) // Split by whitespace
    .filter(word => word.length > 2); // Consider words of length 3+ to catch more matches
  
  console.log('Search keywords:', keywords);
  
  // Calculate a relevance score for each movie
  const scoredMovies = movies.map(movie => {
    let score = 0;
    let keywordMatches = 0;
    let exactTitleMatch = false;
    let partialTitleMatch = false;
    
    // Base score from AI confidence (assuming it's reflected in the order)
    score += 5;
    
    // Bonus for higher ratings
    if (movie.rating) {
      score += Math.min(movie.rating, 10);
    }
    
    // Bonus for more votes (popularity)
    if (movie.voteCount) {
      score += Math.min(Math.log(movie.voteCount) / 2, 5);
    }
    
    // Bonus for having a trailer
    if (movie.trailer) {
      score += 2;
    }
    
    // Bonus for streaming availability
    if (movie.streamingProviders && movie.streamingProviders.length > 0) {
      score += Math.min(movie.streamingProviders.length, 3);
      
      // Extra bonus for subscription vs. rental/purchase
      const hasSubscription = movie.streamingProviders.some(p => p.type === 'subscription');
      if (hasSubscription) {
        score += 2;
      }
    }
    
    // Keyword matching in title, summary, and genres
    const movieTitle = (movie.title || '').toLowerCase();
    const movieSummary = (movie.summary || '').toLowerCase();
    const movieGenres = ((movie.genres || []).join(' ')).toLowerCase();
    
    // Check for exact title match (highest priority)
    if (movieTitle === promptLower ||
        movieTitle.replace(/[^\w\s]/g, '') === promptLower.replace(/[^\w\s]/g, '')) {
      score += 1000; // Massive boost for exact match
      exactTitleMatch = true;
      console.log(`Exact title match found: ${movie.title}`);
    }
    
    // Check for title containing the entire search query
    else if (movieTitle.includes(promptLower)) {
      score += 500; // Big boost for containing the entire query
      partialTitleMatch = true;
      console.log(`Title contains full query: ${movie.title}`);
    }
    
    // Check for franchise match (e.g., "Back to the Future" matches "Back to the Future Part II")
    else if (promptLower.length > 5 &&
            (movieTitle.startsWith(promptLower) ||
             promptLower.startsWith(movieTitle) ||
             movieTitle.includes(promptLower))) {
      score += 300; // Significant boost for franchise match
      partialTitleMatch = true;
      console.log(`Franchise match found: ${movie.title}`);
    }
    
    // Check for keyword matches
    keywords.forEach(keyword => {
      // Skip very common words
      if (['the', 'and', 'for', 'with'].includes(keyword)) return;
      
      // Check title (highest weight)
      if (movieTitle.includes(keyword)) {
        score += 10;
        keywordMatches++;
      }
      
      // Check summary
      if (movieSummary.includes(keyword)) {
        score += 5;
        keywordMatches++;
      }
      
      // Check genres
      if (movieGenres.includes(keyword)) {
        score += 8;
        keywordMatches++;
      }
    });
    
    // Significant boost if multiple keywords match
    if (keywordMatches > 1) {
      score += keywordMatches * 5;
    }
    
    // Return movie with calculated score and match flags
    return {
      ...movie,
      relevanceScore: score,
      keywordMatches,
      exactTitleMatch,
      partialTitleMatch
    };
  });
  
  // For direct title searches, prioritize exact and partial matches
  if (isDirectTitleSearch) {
    const exactMatches = scoredMovies.filter(movie => movie.exactTitleMatch);
    const partialMatches = scoredMovies.filter(movie => movie.partialTitleMatch && !movie.exactTitleMatch);
    
    // If we have exact matches, prioritize those
    if (exactMatches.length > 0) {
      console.log(`Found ${exactMatches.length} exact title matches, prioritizing these`);
      
      // Sort exact matches by score, then add remaining movies
      const remainingMovies = scoredMovies.filter(movie => !movie.exactTitleMatch);
      const sortedExactMatches = exactMatches.sort((a, b) => b.relevanceScore - a.relevanceScore);
      const sortedRemainingMovies = remainingMovies.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      // Return exact matches first, then other movies
      return [...sortedExactMatches, ...sortedRemainingMovies]
        .map(movie => {
          // Remove the scoring properties
          const { relevanceScore, keywordMatches, exactTitleMatch, partialTitleMatch, ...movieWithoutScore } = movie;
          return movieWithoutScore;
        });
    }
    
    // If we have partial matches, prioritize those
    else if (partialMatches.length > 0) {
      console.log(`Found ${partialMatches.length} partial title matches, prioritizing these`);
      
      // Sort partial matches by score, then add remaining movies
      const remainingMovies = scoredMovies.filter(movie => !movie.partialTitleMatch);
      const sortedPartialMatches = partialMatches.sort((a, b) => b.relevanceScore - a.relevanceScore);
      const sortedRemainingMovies = remainingMovies.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      // Return partial matches first, then other movies
      return [...sortedPartialMatches, ...sortedRemainingMovies]
        .map(movie => {
          // Remove the scoring properties
          const { relevanceScore, keywordMatches, exactTitleMatch, partialTitleMatch, ...movieWithoutScore } = movie;
          return movieWithoutScore;
        });
    }
  }
  
  // For regular searches, filter by keyword relevance
  const relevantMovies = scoredMovies.filter(movie => {
    // Keep movies with at least one keyword match or title match
    return movie.keywordMatches > 0 || movie.exactTitleMatch || movie.partialTitleMatch;
  });
  
  // If we have at least 3 relevant movies, use only those
  // Otherwise fall back to all movies (sorted by score)
  const filteredMovies = relevantMovies.length >= 3 ? relevantMovies : scoredMovies;
  
  // Sort by score and remove scoring properties
  return filteredMovies
    .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by score descending
    .map(movie => {
      // Remove the score properties before returning to client
      const { relevanceScore, keywordMatches, exactTitleMatch, partialTitleMatch, ...movieWithoutScore } = movie;
      return movieWithoutScore;
    });
}

app.listen(PORT, () => {
  console.log(`🎬 Triple Feature Backend running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
// Search for movies by director using TMDB API
async function searchMoviesByDirector(directorName) {
  try {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    
    if (!tmdbApiKey) {
      console.warn('TMDB API key not found');
      return [];
    }
    
    // First, search for the director to get their ID
    const personSearchResponse = await axios.get('https://api.themoviedb.org/3/search/person', {
      params: {
        api_key: tmdbApiKey,
        query: directorName,
        include_adult: false,
        language: 'en-US'
      }
    });
    
    if (!personSearchResponse.data.results || personSearchResponse.data.results.length === 0) {
      console.log(`No director found for "${directorName}"`);
      return [];
    }
    
    // Get the first (most relevant) director result
    const director = personSearchResponse.data.results[0];
    console.log(`Found director: ${director.name} (ID: ${director.id})`);
    
    // Get movies the director has directed
    const directorMoviesResponse = await axios.get(`https://api.themoviedb.org/3/person/${director.id}/movie_credits`, {
      params: {
        api_key: tmdbApiKey,
        language: 'en-US'
      }
    });
    
    if (!directorMoviesResponse.data.crew || directorMoviesResponse.data.crew.length === 0) {
      console.log(`No movies found for director ${director.name}`);
      return [];
    }
    
    // Filter for director role and sort by popularity
    const directedMovies = directorMoviesResponse.data.crew
      .filter(movie => movie.job === 'Director')
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10);
    
    console.log(`Found ${directedMovies.length} movies directed by ${director.name}`);
    
    // Convert to our format with streaming providers
    const directorMovies = await Promise.all(
      directedMovies.map(async (movie) => {
        // Get streaming providers for each movie
        const providersResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/watch/providers`, {
          params: {
            api_key: tmdbApiKey
          }
        });
        
        // Extract US streaming providers
        const streamingProviders = [];
        const usProviders = providersResponse.data.results?.US || {};
        
        // Add subscription providers
        if (usProviders.flatrate) {
          usProviders.flatrate.forEach(provider => {
            streamingProviders.push({
              name: provider.provider_name,
              logo: `https://image.tmdb.org/t/p/w45${provider.logo_path}`,
              type: 'subscription'
            });
          });
        }
        
        // Add rental providers
        if (usProviders.rent) {
          usProviders.rent.forEach(provider => {
            if (!streamingProviders.some(p => p.name === provider.provider_name)) {
              streamingProviders.push({
                name: provider.provider_name,
                logo: `https://image.tmdb.org/t/p/w45${provider.logo_path}`,
                type: 'rent'
              });
            }
          });
        }
        
        // Add purchase providers
        if (usProviders.buy) {
          usProviders.buy.forEach(provider => {
            if (!streamingProviders.some(p => p.name === provider.provider_name)) {
              streamingProviders.push({
                name: provider.provider_name,
                logo: `https://image.tmdb.org/t/p/w45${provider.logo_path}`,
                type: 'buy'
              });
            }
          });
        }
        
        return {
          title: movie.title,
          year: movie.release_date ? movie.release_date.substring(0, 4) : 'Unknown',
          summary: movie.overview || `A movie directed by ${director.name}`,
          source: `Director: ${director.name}`,
          tmdb_id: movie.id,
          poster_path: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
          streamingProviders: streamingProviders
        };
      })
    );
    
    return directorMovies;
    
  } catch (error) {
    console.error(`Error searching for movies by director: ${error.message}`);
    return [];
  }
}

// Search for movies by studio/production company using TMDB API
async function searchMoviesByStudio(studioName) {
  try {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    
    if (!tmdbApiKey) {
      console.warn('TMDB API key not found');
      return [];
    }
    
    // Map common studio names to their TMDB company IDs for better results
    const studioMappings = {
      'pixar': 3,
      'disney': 2,
      'marvel': 420,
      'warner': 174,
      'universal': 33,
      'paramount': 4,
      'sony': 5,
      'mgm': 8411,
      '20th century': 25,
      'netflix': 213364,
      'hbo': 49,
      'a24': 41077,
      'blumhouse': 3172,
      'dreamworks': 521,
      'lucasfilm': 1,
      'miramax': 14
    };
    
    let companyId = studioMappings[studioName.toLowerCase()];
    
    // If we don't have a direct mapping, search for the company
    if (!companyId) {
      const companySearchResponse = await axios.get('https://api.themoviedb.org/3/search/company', {
        params: {
          api_key: tmdbApiKey,
          query: studioName
        }
      });
      
      if (companySearchResponse.data.results && companySearchResponse.data.results.length > 0) {
        companyId = companySearchResponse.data.results[0].id;
        console.log(`Found company: ${companySearchResponse.data.results[0].name} (ID: ${companyId})`);
      } else {
        console.log(`No company found for "${studioName}"`);
        return [];
      }
    }
    
    // Get movies from this production company
    const moviesResponse = await axios.get('https://api.themoviedb.org/3/discover/movie', {
      params: {
        api_key: tmdbApiKey,
        with_companies: companyId,
        sort_by: 'popularity.desc',
        language: 'en-US',
        include_adult: false,
        page: 1
      }
    });
    
    if (!moviesResponse.data.results || moviesResponse.data.results.length === 0) {
      console.log(`No movies found for company ${studioName}`);
      return [];
    }
    
    // Take the top 10 most popular movies
    const topMovies = moviesResponse.data.results.slice(0, 10);
    console.log(`Found ${topMovies.length} movies from ${studioName}`);
    
    // Convert to our format with streaming providers
    const studioMovies = await Promise.all(
      topMovies.map(async (movie) => {
        // Get streaming providers for each movie
        const providersResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/watch/providers`, {
          params: {
            api_key: tmdbApiKey
          }
        });
        
        // Extract US streaming providers
        const streamingProviders = [];
        const usProviders = providersResponse.data.results?.US || {};
        
        // Add subscription providers
        if (usProviders.flatrate) {
          usProviders.flatrate.forEach(provider => {
            streamingProviders.push({
              name: provider.provider_name,
              logo: `https://image.tmdb.org/t/p/w45${provider.logo_path}`,
              type: 'subscription'
            });
          });
        }
        
        // Add rental providers
        if (usProviders.rent) {
          usProviders.rent.forEach(provider => {
            if (!streamingProviders.some(p => p.name === provider.provider_name)) {
              streamingProviders.push({
                name: provider.provider_name,
                logo: `https://image.tmdb.org/t/p/w45${provider.logo_path}`,
                type: 'rent'
              });
            }
          });
        }
        
        // Add purchase providers
        if (usProviders.buy) {
          usProviders.buy.forEach(provider => {
            if (!streamingProviders.some(p => p.name === provider.provider_name)) {
              streamingProviders.push({
                name: provider.provider_name,
                logo: `https://image.tmdb.org/t/p/w45${provider.logo_path}`,
                type: 'buy'
              });
            }
          });
        }
        
        return {
          title: movie.title,
          year: movie.release_date ? movie.release_date.substring(0, 4) : 'Unknown',
          summary: movie.overview || `A movie from ${studioName}`,
          source: `Studio: ${studioName}`,
          tmdb_id: movie.id,
          poster_path: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
          streamingProviders: streamingProviders
        };
      })
    );
    
    return studioMovies;
    
  } catch (error) {
    console.error(`Error searching for movies by studio: ${error.message}`);
    return [];
  }
}
