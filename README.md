# 🎬 Triple Feature - AI Movie Recommendations

> AI-powered movie discovery based on your mood and preferences

A beautiful, mobile-first movie recommendation website that uses multiple AI models to suggest relevant movies based on your mood or vibe.

![Triple Feature Screenshot](https://via.placeholder.com/800x400/1a1a2e/ffffff?text=Triple+Feature+Movie+Recommendations)

## ✨ Features

- **AI-Powered Recommendations**: Get movie suggestions from GPT and Claude based on natural language descriptions
- **Beautiful Interface**: Clean, mobile-first design with stunning movie posters
- **Movie Details**: Complete information including summaries, release years, and streaming availability
- **Wikipedia Integration**: Quick access to detailed movie information
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Real-time Search**: Instant results as you describe your movie mood

## 🚀 Live Demo

Visit the live application: [Triple Feature](https://OfficeAtNite.github.io/whatch)

## 🛠️ Tech Stack

- **Frontend**: React + TailwindCSS
- **AI APIs**: OpenRouter (GPT, Claude)
- **Movie Data**: The Movie Database (TMDB)
- **Deployment**: GitHub Pages

## 📋 Prerequisites

Before running this project, you'll need API keys for:

1. **OpenRouter** - For AI movie recommendations
   - Sign up at [openrouter.ai](https://openrouter.ai)
   - Get your API key from the dashboard

2. **TMDB** - For movie posters and details
   - Sign up at [themoviedb.org](https://www.themoviedb.org/settings/api)
   - Get your API key from account settings

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/OfficeAtNite/whatch.git
   cd whatch
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```env
   REACT_APP_OPENROUTER_API_KEY=your_openrouter_api_key_here
   REACT_APP_TMDB_API_KEY=your_tmdb_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎯 Usage

1. **Enter your movie vibe** - Describe what kind of movie you're in the mood for
   - Examples: "mind-bending sci-fi thrillers"
   - "romantic comedies from the 90s"
   - "action movies with high ratings"

2. **Get AI recommendations** - Multiple AI models will suggest movies based on your description

3. **Explore results** - Browse movie cards with posters, summaries, and streaming info

4. **Learn more** - Click Wiki buttons for detailed movie information

## 🚀 Deployment to GitHub Pages

This project uses GitHub Actions for automatic deployment with secure API key management.

### For Repository Owners:
1. **Set up GitHub Secrets** - Follow the detailed guide in [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md)
2. **Push to master branch** - GitHub Actions will automatically build and deploy
3. **Monitor deployment** - Check the Actions tab for deployment status

### Manual Deployment (Local):
If you prefer manual deployment:
```bash
npm run build
npm run deploy
```
Note: Manual deployment won't include API keys for the live site.

## 🔒 Security

- API keys are protected using `.gitignore`
- Environment variables are used for sensitive data
- `.env.example` provides template for required keys

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai) for AI API access
- [The Movie Database](https://www.themoviedb.org) for movie data
- [React](https://reactjs.org) for the frontend framework
- [TailwindCSS](https://tailwindcss.com) for styling

## 📧 Contact

**OfficeAtNite** - [@OfficeAtNite](https://github.com/OfficeAtNite)

Project Link: [https://github.com/OfficeAtNite/whatch](https://github.com/OfficeAtNite/whatch)

---

⭐ If you found this project helpful, please give it a star!
