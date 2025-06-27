# Gymbro Fitness Tracker

## Deploy to Railway (Recommended)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app)

### Quick Deploy Steps:

1. **Push to GitHub** (if not already)
2. **Connect to Railway**:
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub account
   - Select this repository
   - Choose the `backend` folder as root

3. **Environment Variables** (Railway will auto-detect most):
   ```
   JWT_SECRET=your-production-jwt-secret-here
   NODE_ENV=production
   PORT=3000
   ```

4. **Frontend Deployment**:
   - Upload the `GainsGainsGains` folder to Railway or Vercel
   - Update API URLs in frontend to point to your Railway backend

## Alternative Deployments

### Render
1. Connect GitHub repo
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables

### Vercel (Frontend only)
1. Deploy `GainsGainsGains` folder
2. Configure redirects for SPA

### DigitalOcean
1. Create droplet
2. Install Node.js
3. Upload code
4. Use PM2 for process management

## Environment Setup

Create `.env.production`:
```
NODE_ENV=production
JWT_SECRET=your-super-secret-production-key
PORT=3000
DB_PATH=./database/gymbro.db
```

## Post-Deployment

1. Test authentication
2. Verify data sync
3. Check CORS settings
4. Set up SSL (auto on Railway/Render)
