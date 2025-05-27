# GitHub Secrets Setup for Triple Feature

This guide will help you set up GitHub Secrets so your deployed app can access API keys securely.

## 🔐 Setting Up GitHub Secrets

### Step 1: Access Repository Settings
1. Go to your GitHub repository: `https://github.com/OfficeAtNite/whatch`
2. Click on **Settings** tab (top right of repository)
3. In the left sidebar, click **Secrets and variables** → **Actions**

### Step 2: Add Your API Keys as Secrets
Click **New repository secret** for each of the following:

#### Required Secrets:

**1. REACT_APP_OPENROUTER_API_KEY**
- Name: `REACT_APP_OPENROUTER_API_KEY`
- Value: `[Your OpenRouter API key from your .env file]`

**2. REACT_APP_TMDB_API_KEY**
- Name: `REACT_APP_TMDB_API_KEY`
- Value: `[Your TMDB API key from your .env file]`

**3. REACT_APP_GEMINI_API_KEY** (Optional - currently has issues)
- Name: `REACT_APP_GEMINI_API_KEY`
- Value: `[Your Gemini API key or leave as placeholder]`

### Step 3: Verify Secrets
After adding all secrets, you should see them listed in the repository secrets section (values will be hidden for security).

## 🚀 How It Works

### GitHub Actions Workflow
The `.github/workflows/deploy.yml` file automatically:

1. **Triggers** on every push to the `master` branch
2. **Installs** dependencies with `npm ci`
3. **Builds** the React app with environment variables from GitHub Secrets
4. **Deploys** the built app to GitHub Pages

### Environment Variables
During the build process, GitHub Actions will inject your secrets as environment variables:
```bash
REACT_APP_OPENROUTER_API_KEY=${{ secrets.REACT_APP_OPENROUTER_API_KEY }}
REACT_APP_TMDB_API_KEY=${{ secrets.REACT_APP_TMDB_API_KEY }}
REACT_APP_GEMINI_API_KEY=${{ secrets.REACT_APP_GEMINI_API_KEY }}
```

## 📋 Next Steps

1. **Add the secrets** to your GitHub repository (see Step 2 above)
2. **Push this commit** to trigger the GitHub Actions workflow
3. **Monitor the deployment** in the Actions tab of your repository
4. **Visit your site** at `https://OfficeAtNite.github.io/whatch`

## 🔍 Troubleshooting

### Check GitHub Actions
- Go to **Actions** tab in your repository
- Look for the "Deploy to GitHub Pages" workflow
- Click on the latest run to see logs and any errors

### Common Issues
- **Secrets not set**: Make sure all required secrets are added with exact names
- **Build fails**: Check the Actions logs for specific error messages
- **Site not updating**: GitHub Pages can take a few minutes to update after deployment

### Verify Deployment
Once the workflow completes successfully:
- Your site should show movie recommendations when you search
- Check browser console for any API errors
- Test with different search terms like "sci-fi thrillers" or "romantic comedies"

## 🔒 Security Benefits

✅ **API keys are encrypted** and only accessible during the build process
✅ **Keys never appear** in your repository code or commit history  
✅ **Automatic deployment** without manual key management
✅ **Professional CI/CD** setup for production applications

---

**Need help?** Check the GitHub Actions logs or create an issue in the repository.