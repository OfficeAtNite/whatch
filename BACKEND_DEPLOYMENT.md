# 🚀 Backend Deployment Guide for Triple Feature

This guide will help you deploy your secure backend API to keep your API keys private while enabling full functionality on your live site.

## 🏗️ Architecture Overview

### **Frontend (GitHub Pages)**
- React app deployed to `https://OfficeAtNite.github.io/whatch`
- Contains no API keys (secure)
- Makes requests to your backend API

### **Backend (Vercel/Railway/Render)**
- Node.js Express server
- Stores API keys securely as environment variables
- Proxies requests to AI APIs (OpenRouter, TMDB, Gemini)

## 🔐 Security Benefits

✅ **API keys never exposed** to the browser or frontend code
✅ **CORS protection** - only your frontend can access the backend
✅ **Rate limiting** can be added to prevent abuse
✅ **Professional architecture** - industry standard approach

## 🚀 Deployment Options

### Option 1: Vercel (Recommended - Free Tier)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy from backend directory**
   ```bash
   cd backend
   vercel
   ```

3. **Set environment variables in Vercel dashboard**
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add these variables:
     - `OPENROUTER_API_KEY`: `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`
     - `TMDB_API_KEY`: `7c7b986d6410043f1e8f85f10c0167ee`
     - `GEMINI_API_KEY`: `AIzaSyDummy_Replace_With_Your_Gemini_Key`

4. **Update frontend to use production backend**
   - Add to your main `.env` file:
     ```
     REACT_APP_BACKEND_URL=https://your-backend-url.vercel.app
     ```

### Option 2: Railway (Alternative)

1. **Connect GitHub repository**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub account
   - Deploy from the `backend` folder

2. **Set environment variables**
   - In Railway dashboard, add the same environment variables as above

### Option 3: Render (Alternative)

1. **Create new Web Service**
   - Go to [render.com](https://render.com)
   - Connect your GitHub repository
   - Set build command: `npm install`
   - Set start command: `npm start`

## 🔧 Local Testing

### **Test Backend Locally**
```bash
cd backend
npm start
```
Backend runs on: `http://localhost:3001`

### **Test Frontend with Local Backend**
```bash
# In main directory
npm start
```
Frontend runs on: `http://localhost:3000` and connects to local backend

### **Test API Endpoints**
```bash
# Health check
curl http://localhost:3001/api/health

# Test recommendations
curl -X POST http://localhost:3001/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "sci-fi thrillers"}'
```

## 📝 Frontend Configuration

### **For Production Deployment**
1. **Update frontend environment**
   ```bash
   # Add to main .env file
   REACT_APP_BACKEND_URL=https://your-deployed-backend-url.vercel.app
   ```

2. **Build and deploy frontend**
   ```bash
   npm run build
   npm run deploy
   ```

### **Environment Variables**
- **Local development**: Uses `http://localhost:3001`
- **Production**: Uses `REACT_APP_BACKEND_URL` from environment

## 🧪 Testing Your Deployment

### **1. Test Backend Health**
Visit: `https://your-backend-url.vercel.app/api/health`
Should return: `{"status": "OK", "message": "Triple Feature Backend is running"}`

### **2. Test Movie Recommendations**
Use a tool like Postman or curl:
```bash
curl -X POST https://your-backend-url.vercel.app/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "action movies with great special effects"}'
```

### **3. Test Frontend Integration**
1. Visit your GitHub Pages site
2. Search for "romantic comedies"
3. Should see actual movie recommendations with posters!

## 🔍 Troubleshooting

### **Common Issues**

**Backend not responding**
- Check environment variables are set correctly
- Verify API keys are valid
- Check deployment logs

**CORS errors**
- Ensure your frontend URL is in the CORS whitelist
- Check that you're using HTTPS for production

**No movie results**
- Check backend logs for API errors
- Verify API keys have sufficient credits/quota
- Test individual API endpoints

### **Debugging**
```bash
# Check backend logs (Vercel)
vercel logs

# Test local backend
cd backend && npm start

# Check frontend console for errors
# Open browser dev tools → Console tab
```

## 🎯 Next Steps

1. **Deploy backend** to Vercel/Railway/Render
2. **Set environment variables** with your API keys
3. **Update frontend** with production backend URL
4. **Deploy frontend** with `npm run deploy`
5. **Test live site** - should now work with full AI functionality!

## 🔒 Security Notes

- Never commit `.env` files to git
- Use different API keys for development and production if possible
- Monitor API usage to prevent unexpected charges
- Consider adding rate limiting for production use

---

**Need help?** Check the deployment platform's documentation or create an issue in the repository.