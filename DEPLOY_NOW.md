# Gymbro - Quick Deploy Guide

## 🚀 Deploy in 5 Minutes

### **Option 1: Railway (Recommended)**

1. **Create Railway Account**: Go to [railway.app](https://railway.app)

2. **Deploy Backend**:
   ```bash
   # In your backend folder
   cd backend
   
   # Initialize git if not already done
   git init
   git add .
   git commit -m "Initial backend commit"
   
   # Push to GitHub (create repo first)
   git remote add origin https://github.com/yourusername/gymbro-backend.git
   git push -u origin main
   ```

3. **Connect to Railway**:
   - Click "Deploy from GitHub repo"
   - Select your backend repository
   - Railway will auto-detect Node.js and deploy!

4. **Set Environment Variables** in Railway dashboard:
   ```
   JWT_SECRET=your-super-secret-production-key-change-this-now
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-domain.com
   ```

5. **Deploy Frontend**:
   - Upload `GainsGainsGains` folder to **Vercel** or **Netlify** for free
   - Or deploy to Railway as a static site

6. **Update Frontend Config**:
   - Edit `config.js` to point to your Railway backend URL:
   ```javascript
   window.GYMBRO_API_URL = 'https://your-app-name.railway.app/api';
   ```

### **Option 2: Render (Also Free)**

1. **Backend**: Deploy to Render Web Service
2. **Frontend**: Deploy to Render Static Site
3. **Database**: Use Render's built-in PostgreSQL (optional upgrade)

### **Option 3: DigitalOcean ($6/month)**

```bash
# Create droplet and deploy
ssh root@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Clone and setup
git clone https://github.com/yourusername/gymbro.git
cd gymbro/backend
npm install
npm start

# Use PM2 for production
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save
```

## 🎯 **Quick Test Your Deployment**

After deploying, test these URLs:
- `https://your-backend.railway.app/api/health` - Should return `{"status":"OK"}`
- `https://your-frontend.vercel.app` - Should load the login page

## 🔧 **Troubleshooting**

**CORS Issues**: Update FRONTEND_URL environment variable  
**Database Issues**: Check Railway logs for SQLite permissions  
**Login Issues**: Verify JWT_SECRET is set properly

## 💰 **Cost Breakdown**

- **Railway**: $5-10/month (includes both frontend + backend)
- **Vercel + Railway**: $5/month (frontend free, backend paid)
- **Render**: Free tier available (limited hours)
- **DigitalOcean**: $6/month (full control)

## 🎉 **You're Ready!**

Your Gymbro app is production-ready with:
- ✅ User authentication
- ✅ Data persistence
- ✅ Offline support
- ✅ Cross-device sync
- ✅ Responsive design

**Choose Railway for easiest deployment!** 🚄
