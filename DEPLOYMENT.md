# KK Food Billing - Deployment Guide

## Free Hosting Deployment (Recommended)

This application is configured for FREE hosting using:
- **Frontend**: Vercel (https://vercel.com)
- **Backend**: Render.com (https://render.com)

### Quick Deployment Steps

#### Prerequisites
1. Create a GitHub account and repository for this project
2. Push your code to GitHub: `git push origin main`

#### Deploy Backend to Render.com

1. **Sign Up**: Go to [render.com](https://render.com) and sign up with GitHub
2. **New Web Service**: Click "New +" → "Web Service"
3. **Connect Repository**: Select your GitHub repository
4. **Configure Service**:
   - **Name**: `kk-food-backend`
   - **Root Directory**: `backend/KKFoodBilling.Backend`
   - **Runtime**: Docker or .NET
   - **Build Command**: `dotnet publish -c Release -o ./publish`
   - **Start Command**: `cd publish && dotnet KKFoodBilling.Backend.dll --urls=http://0.0.0.0:10000`
   - **Plan**: Select "Free"
5. **Environment Variables**:
   - `ASPNETCORE_ENVIRONMENT` = `Production`
   - `ASPNETCORE_URLS` = `http://0.0.0.0:10000`
6. **Deploy**: Click "Create Web Service"
7. **Copy URL**: Note your backend URL (e.g., `https://kk-food-backend.onrender.com`)

#### Deploy Frontend to Vercel

1. **Sign Up**: Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. **Import Project**: Click "Add New..." → "Project"
3. **Select Repository**: Choose your GitHub repository
4. **Configure**:
   - Framework: Vite (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Environment Variables**:
   - `VITE_API_BASE_URL` = Your Render backend URL
6. **Deploy**: Click "Deploy"
7. **Access**: Your app is now live at `https://your-app.vercel.app`

#### Update CORS (Important!)
After deployment, update the Vercel URL in your backend's CORS configuration:
1. Edit `backend/KKFoodBilling.Backend/Program.cs`
2. Replace `https://kk-food-billing.vercel.app` with your actual Vercel URL
3. Commit and push to GitHub
4. Render will auto-redeploy

### Free Tier Limitations

**Render.com Backend:**
- ⚠️  Sleeps after 15 minutes of inactivity
- ⚠️  First request after sleep takes ~30 seconds
- ✅ 750 instance hours/month (enough for 24/7 uptime)
- ✅ Automatic Git deployments

**Vercel Frontend:**
- ✅ 100GB bandwidth/month
- ✅ 6000 build minutes/month
- ✅ Global CDN
- ✅ Automatic Git deployments

### Keep Backend Awake (Optional)

Use [UptimeRobot](https://uptimerobot.com) (free) to ping your backend every 5 minutes:
1. Sign up at uptimerobot.com
2. Add monitor for your backend `/swagger` endpoint
3. Set interval to 5 minutes

---

## Local Development

### Development Mode (Recommended for Testing)
```powershell
.\start-dev.ps1
```
- Starts backend and frontend in development mode
- Hot reload enabled for both
- Best for development and testing

### Production Mode
1. **Build the application:**
   ```powershell
   .\build-prod.ps1
   ```

2. **Start production servers:**
   ```powershell
   .\start-prod.ps1
   ```
   - Optimized production build
   - Better performance
   - Minified assets

### Stop All Servers
```powershell
.\stop-all.ps1
```

## Data Persistence

All data is stored in JSON files located at:
```
backend\KKFoodBilling.Backend\Data\
  ├── products.json  (Product inventory)
  └── bills.json     (Sales records)
```

**Note for Free Hosting**: Backup your JSON files regularly as free tier platforms may reset storage occasionally.

## Endpoints

### Local Development
- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:55219
  - **Swagger UI:** http://localhost:55219/swagger

### Production (After Deployment)
- **Frontend:** https://your-app.vercel.app
- **Backend API:** https://your-backend.onrender.com
  - **Swagger UI:** https://your-backend.onrender.com/swagger

## Troubleshooting

### Backend Slow to Respond (Production)
- Normal! Free tier backends sleep after 15 minutes
- First request after sleep takes ~30 seconds
- Consider using UptimeRobot to keep awake

### CORS Errors
- Make sure you updated the Vercel URL in `Program.cs`
- Redeploy backend after CORS changes

### Port Already in Use (Local)
Run `.\stop-all.ps1` first.

### Backend Not Starting (Local)
Ensure .NET SDK is installed:
```powershell
dotnet --version
```

### Frontend Build Fails
Clear cache and reinstall:
```powershell
npm cache clean --force
npm install
```

## System Requirements

- **.NET SDK:** 10.0 or higher
- **Node.js:** 18.0 or higher
- **npm:** 9.0 or higher
- **Windows:** PowerShell 5.1 or higher
