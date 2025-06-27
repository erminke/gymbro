# 🚀 Gymbro Deployment Guide

## Your Repository
✅ **GitHub**: https://github.com/erminke/gymbro

## Deployment Steps

### 1. Deploy Backend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project" → Import `erminke/gymbro`
3. Configure:
   - **Root Directory**: `backend`
   - **Framework**: Other
   - **Build Command**: `npm install`
4. Add Environment Variables:
   ```
   NODE_ENV=production
   JWT_SECRET=GymBro2024_SecureJWT_ProductionKey_9X2mK8pL4nQ7sR1vW6tY3uE5oI8aB2cD
   JWT_EXPIRES_IN=7d
   ```
5. Click "Deploy"
6. **IMPORTANT**: Copy the deployment URL (e.g., `https://gymbro-backend-abc123.vercel.app`)

### 2. Update Frontend Configuration

**Choose one of these options:**

#### Option A: Direct URL Update (Easier)
1. Open `GainsGainsGains/config.js`
2. Replace the placeholder with your actual backend URL:
   ```javascript
   // Replace this line:
   window.GYMBRO_API_URL = 'https://your-actual-backend-url.vercel.app/api';
   
   // With your real URL (example):
   window.GYMBRO_API_URL = 'https://gymbro-backend-abc123.vercel.app/api';
   ```
3. Commit and push:
   ```bash
   git add GainsGainsGains/config.js
   git commit -m "Update API URL for production"
   git push
   ```

#### Option B: Environment Variable (More Professional)
1. When deploying frontend, add this environment variable in Vercel:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app/api
   ```
2. Update `config.js` to use environment variable:
   ```javascript
   window.GYMBRO_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fallback-url.vercel.app/api';
   ```

### 3. Deploy Frontend to Vercel

### 3. Deploy Frontend to Vercel

1. Create another new project in Vercel
2. Import the same repository: `erminke/gymbro`
3. Configure:
   - **Root Directory**: `GainsGainsGains`
   - **Framework**: Other (Static)
4. Click "Deploy"
5. **Done!** Your app is now live with the correct backend connection

### 4. Test Your App

1. Visit your frontend URL
2. Register a new account or use demo credentials:
   - Email: test@example.com
   - Password: password123
3. Test all features:
   - ✅ Login/Register
   - ✅ Add workouts
   - ✅ Track supplements
   - ✅ Log meals
   - ✅ Weight tracking
   - ✅ Data sync between devices

## Alternative Deployment Options

### Railway (Easier for full-stack)
- Deploy entire repo to Railway
- Auto-detects Node.js backend
- Built-in PostgreSQL available

### Render
- Free tier with 750 hours/month
- Good for Node.js + SQLite
- Auto-deploys from GitHub

## Demo Credentials
- **Email**: test@example.com
- **Password**: password123

## Important Notes

### JWT Token Expiration (7 days)
- **What it means**: User login sessions expire after 7 days
- **What happens**: Users need to log in again after 7 days
- **Does the app stop working?**: No! The app keeps running 24/7
- **Do you need to redeploy?**: No! Only users need to re-authenticate
- **Can you change it?**: Yes, modify `JWT_EXPIRES_IN` to `30d` for 30 days, etc.

### Database Storage
- SQLite database persists all user data permanently
- Data survives app restarts and redeployments
- Users don't lose their workout/meal/supplement data

## Features
- 🏋️‍♂️ Workout tracking
- 💊 Supplement scheduling
- 🍽️ Meal logging
- 📊 Progress charts
- ⚖️ Weight tracking & BMI
- 🔄 Cross-device sync
- 📱 Mobile responsive
- 🔐 User authentication

## Support
If you encounter issues:
1. Check browser console for errors
2. Verify API URL in config.js
3. Ensure backend environment variables are set
4. Test backend health: `https://your-backend-url/api/health`

---
**Happy fitness tracking! 💪**
