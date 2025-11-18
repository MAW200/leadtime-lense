# Fix CORS and Start Backend Server

## Issue
The frontend (running on `http://localhost:8080`) cannot connect to the backend (`http://localhost:3001`) due to CORS errors.

## Solution Applied
✅ Updated CORS configuration in `server/src/index.js` to allow multiple origins:
- `http://localhost:5173` (Vite default)
- `http://localhost:8080` (Your current frontend)
- `http://localhost:3000` (Alternative port)

## Steps to Fix

### 1. Restart Backend Server
The CORS fix requires restarting the backend server:

```powershell
# Stop any running backend server (Ctrl+C)
# Then start it again:
cd server
npm run dev
```

### 2. Verify Backend is Running
Open a browser and go to: `http://localhost:3001/health`

You should see: `{"status":"ok","timestamp":"..."}`

### 3. Check Database Connection
Make sure your MySQL database is running and the `.env` file in `server/` has correct credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=leadtime_lense
PORT=3001
```

### 4. Verify Frontend API URL
Check that `src/lib/api.ts` has the correct API URL:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```

## Common Issues

### Backend Not Starting
- Check if port 3001 is already in use: `netstat -ano | findstr :3001`
- Kill the process if needed: `taskkill /PID <PID> /F`

### Database Connection Errors
- Verify MySQL is running
- Check database name matches: `leadtime_lense` or `invMod`
- Verify credentials in `server/.env`

### CORS Still Failing
- Clear browser cache
- Hard refresh: `Ctrl+Shift+R`
- Check browser console for specific CORS error

## Testing

After restarting the backend, the frontend should be able to:
- ✅ Load inventory items
- ✅ Load projects
- ✅ Load notifications
- ✅ Make API calls without CORS errors

