# Fix Network Errors - Backend Not Running

## 🔍 Problem

You're seeing network errors like:
- `(failed) net::E...` for all API requests
- `/api/inventory` - failed
- `/api/notifications` - failed
- `/api/unread-count` - failed

**Root Cause:** The backend server is not running on port 3001.

---

## ✅ Solution

### Step 1: Start the Backend Server

Open a **new terminal** and run:

```powershell
cd "W:\Actual Work\Inv Mod\leadtime-lense\server"
npm run dev
```

You should see:
```
🚀 Server running on port 3001
✅ MySQL database connected
```

### Step 2: Verify Backend is Running

Open another terminal and test:

```powershell
# Test health endpoint
curl http://localhost:3001/health
```

Or open in browser: `http://localhost:3001/health`

You should see: `{"status":"ok","timestamp":"..."}`

### Step 3: Check Database Connection

Make sure your MySQL database is running (XAMPP) and the `.env` file is correct:

**`server/.env`** should have:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=invmod
PORT=3001
```

### Step 4: Refresh Frontend

After backend is running:
1. Refresh your browser (hard refresh: `Ctrl+Shift+R`)
2. Check browser console - errors should be gone
3. API calls should now work

---

## 🐛 Troubleshooting

### Backend Won't Start

**Check if port 3001 is in use:**
```powershell
netstat -ano | findstr :3001
```

**Kill the process if needed:**
```powershell
taskkill /PID <PID_NUMBER> /F
```

### Database Connection Errors

**Check MySQL is running:**
- Open XAMPP Control Panel
- Make sure MySQL is running (green)

**Verify database exists:**
```sql
-- In phpMyAdmin or MySQL command line
SHOW DATABASES;
-- Should see 'invmod' database
```

**Check database name matches:**
- `.env` file: `DB_NAME=invmod`
- Database name in MySQL: `invmod`

### Still Getting Errors?

1. **Check backend terminal** for error messages
2. **Check browser console** for specific error details
3. **Verify CORS** - backend should allow `http://localhost:8080`
4. **Clear browser cache** and hard refresh

---

## 📝 Quick Start Commands

```powershell
# Terminal 1: Start Backend
cd "W:\Actual Work\Inv Mod\leadtime-lense\server"
npm run dev

# Terminal 2: Start Frontend (if not already running)
cd "W:\Actual Work\Inv Mod\leadtime-lense"
npm run dev

# Terminal 3: Seed Dummy Data (after backend is running)
cd "W:\Actual Work\Inv Mod\leadtime-lense\server"
npm run seed
```

---

## ✅ Success Indicators

When everything is working:
- ✅ Backend terminal shows: "Server running on port 3001"
- ✅ Browser console shows successful API calls (200 status)
- ✅ Frontend loads data (inventory, projects, notifications)
- ✅ No network errors in browser DevTools

---

## 🎯 Next Steps

After fixing the network errors:
1. **Seed dummy data** using `npm run seed` in server directory
2. **Test the application** - all features should work
3. **Check Laravel integration** - review `LARAVEL_INTEGRATION_ANALYSIS.md`

