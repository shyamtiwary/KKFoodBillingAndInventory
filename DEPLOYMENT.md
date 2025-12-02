# Deploying to Render.com with PostgreSQL

This guide covers deploying the KK Food Billing & Inventory application to Render with PostgreSQL for persistent data storage.

## Prerequisites

- GitHub account
- Render.com account (free tier sufficient)
- Application code pushed to GitHub

## Quick Start with render.yaml

The easiest way to deploy is using the included `render.yaml`:

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Blueprint**
3. Connect your GitHub repository
4. Render will automatically create:
   - PostgreSQL database (`kk-food-postgres`)
   - Backend API service (`kk-food-backend`)

## Manual Deployment Steps

### 1. Create PostgreSQL Database

1. Click **New +** → **PostgreSQL**
2. Configure:
   - **Name**: `kk-food-postgres`
   - **Database**: `kkfood`
   - **User**: `kkfood_user` (auto-generated)
   - **Region**: Choose closest to users
   - **Plan**: **Free**
3. Click **Create Database**
4. **Important**: Copy the **Internal Database URL** for later

### 2. Create Backend Web Service

1. Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Configure:

**Basic Settings:**
- **Name**: `kk-food-backend`
- **Region**: Same as database
- **Branch**: `main`
- **Root Directory**: `backend/KKFoodBilling.Backend`
- **Runtime**: Docker

**Build & Deploy:**
- **Build Command**:
  ```bash
  dotnet publish -c Release -o ./publish
  ```
- **Start Command**:
  ```bash
  dotnet ./publish/KKFoodBilling.Backend.dll --urls=http://0.0.0.0:10000
  ```

**Environment Variables:**
Add these environment variables:

| Key | Value |
|-----|-------|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ASPNETCORE_URLS` | `http://0.0.0.0:10000` |
| `DatabaseProvider` | `PostgreSQL` |
| `ConnectionStrings__PostgreSqlConnection` | (Paste Internal Database URL from step 1) |

**Instance Type:** Free

4. Click **Create Web Service**

### 3. Verify Deployment

1. Wait for build to complete (~2-3 minutes)
2. Check logs for "Application started" message
3. Visit `https://your-backend.onrender.com/swagger` to verify API is running
4. Check database tables were created:
   - Go to your PostgreSQL service in Render
   - Click **Connect** → **External Connection**
   - Use provided credentials to connect via psql or pgAdmin
   - Verify tables: `Products`, `Bills`, `BillItems`

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Configure:
   - **Framework**: Vite
   - **Root Directory**: `/` (or specify if different)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variable**:
     - Key: `VITE_API_BASE_URL`
     - Value: `https://your-backend.onrender.com`

### Option 2: Render Static Site

1. Click **New +** → **Static Site**
2. Connect repository
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variable**: `VITE_API_BASE_URL` = backend URL

## Testing the Deployment

1. Visit your frontend URL
2. Login with default credentials: `admin` / `password`
3. Test features:
   - Create a product in Inventory
   - Create a bill
   - Delete a bill (admin only)
   - Export PDF from Inventory/Reports
4. **Restart backend** and verify data persists

## Troubleshooting

### Database Connection Errors

**Check logs** for connection issues:
```bash
# View logs in Render Dashboard
# Look for "Connection refused" or "Authentication failed"
```

**Common fixes:**
- Ensure `ConnectionStrings__PostgreSqlConnection` uses the **Internal Database URL**
- Verify database and backend are in the **same region**
- Check firewall settings (should be unrestricted for internal connections)

### Tables Not Created

If tables don't exist:
1. Check `DatabaseInitializer` logs in backend startup
2. Verify `DatabaseProvider` is set to `PostgreSQL`
3. Manually create tables via psql:
   ```sql
   \c kkfood
   \dt
   -- If tables missing, check logs for errors
   ```

### CORS Errors

Update `Program.cs` if deploying frontend to a new domain:
```csharp
if (uri.Host.EndsWith(".onrender.com")) return true;
if (origin == "https://your-app.vercel.app") return true;
```

### Backend Cold Starts

Free tier services sleep after 15 minutes of inactivity:
- First request takes ~30-60 seconds
- Consider upgrading to paid tier for production
- Or use a ping service to keep it awake

## Environment Configuration

### Local Development (SQLite)
```bash
# appsettings.json
"DatabaseProvider": "SQLite"
```

### Production (PostgreSQL)
```bash
# Set in Render Environment Variables
DATABASE_PROVIDER=PostgreSQL
ConnectionStrings__PostgreSqlConnection=<internal_database_url>
```

## Database Migration

To migrate existing SQLite data to PostgreSQL:

1. Export data from local SQLite:
   ```bash
   # Use SQLite Browser or command:
   sqlite3 KKFoodBilling.db .dump > data.sql
   ```

2. Convert to PostgreSQL format (adjust syntax as needed)

3. Import to Render PostgreSQL:
   ```bash
   psql <connection_string> < data_postgresql.sql
   ```

## Next Steps

- [ ] Configure custom domain
- [ ] Set up automatic deployments via GitHub
- [ ] Add environment-specific logging
- [ ] Implement database backups
- [ ] Monitor application performance
- [ ] Add health check endpoints

## Free Tier Limitations

**Render Free Tier:**
- 750 hours/month per service
- Services sleep after 15 min inactivity
- PostgreSQL: 90-day data retention
- Shared CPU/RAM

**Recommended for Production:**
- Upgrade backend to paid tier ($7/month)
- Use Render PostgreSQL starter ($7/month)
- Deploy frontend to Vercel (free for personal projects)
