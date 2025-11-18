# Troubleshooting Network Errors

## 🔴 Issue: Failed API Requests (Red X in Network Tab)

### Root Cause

**The backend server is not running on port 3001.**

When you see:

- ❌ Red X marks on requests (`notifications`, `inventory`, `unread-count`)
- ⚠️ "Provisional headers are shown" warning
- 🔴 Failed requests to `http://localhost:3001/api/*`

This means the frontend is trying to connect, but the backend server isn't running.

---

## ✅ Solution: Start the Backend Server

### Step 1: Navigate to Server Directory

```powershell
cd server
```

### Step 2: Check Environment File

Make sure `server/.env` exists with:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=leadtime_lense
PORT=3001
```

### Step 3: Start the Server

```powershell
npm run dev
```

You should see:

```
🚀 Server running on http://localhost:3001
📊 Health check: http://localhost:3001/health
```

### Step 4: Verify Server is Running

Open browser and go to: `http://localhost:3001/health`

Should return: `{"status":"ok","timestamp":"..."}`

---

## 🔍 Common Issues & Fixes

### Issue 1: Port 3001 Already in Use

**Error:** `EADDRINUSE: address already in use :::3001`

**Fix:**

```powershell
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process (replace <PID> with actual process ID)
taskkill /PID <PID> /F
```

### Issue 2: MySQL Connection Error

**Error:** `Access denied for user 'root'@'localhost'`

**Fix:**

1. Make sure MySQL is running in XAMPP
2. Check `server/.env` has correct credentials:
   - XAMPP default: `DB_PASSWORD=` (empty)
   - Or use your MySQL password

### Issue 3: Database Doesn't Exist

**Error:** `Unknown database 'leadtime_lense'`

**Fix:**

1. Create the database:
   ```sql
   CREATE DATABASE leadtime_lense;
   ```
2. Or update `server/.env` to use existing database name

### Issue 4: CORS Errors Still Appearing

**Even after starting server, still seeing CORS errors**

**Fix:**

1. **Hard refresh browser:** `Ctrl+Shift+R`
2. **Clear browser cache**
3. **Check backend logs** - should see incoming requests
4. **Verify CORS config** in `server/src/index.js`:
   ```javascript
   origin: true, // Should allow all origins
   ```

### Issue 5: "Provisional Headers" Warning

**This warning appears when:**

- Backend server is not running ✅ (Most common)
- Request is blocked by browser extension
- CORS preflight fails

**Fix:** Start the backend server first, then check again.

---

## 📋 Verification Checklist

After starting the backend server:

- [ ] Backend server shows: `🚀 Server running on http://localhost:3001`
- [ ] Health check works: `http://localhost:3001/health` returns JSON
- [ ] No errors in backend console
- [ ] Frontend can make API calls (check Network tab)
- [ ] No more red X marks on requests
- [ ] Data loads in the application

---

## 🚀 Quick Start Commands

```powershell
# Terminal 1: Start Backend
cd server
npm run dev

# Terminal 2: Start Frontend (in project root)
npm run dev

# Terminal 3: Check if backend is running
curl http://localhost:3001/health
```

---

## 📊 Understanding the Errors

### "Provisional Headers" Meaning

This warning means the browser couldn't complete the request. Common causes:

1. **Server not running** (most common)
2. Request blocked before reaching server
3. Network error

### Red X Marks

- **Failed requests** - Server didn't respond
- Usually means backend is down
- Check backend console for errors

### Network Tab Status

- **Pending** = Request in progress
- **Failed** = Request failed (server down or error)
- **200 OK** = Success ✅

---

## 🆘 Still Having Issues?

1. **Check backend console** for error messages
2. **Check MySQL is running** in XAMPP
3. **Verify database exists** and has tables
4. **Check `server/.env`** has correct credentials
5. **Restart both servers** (backend and frontend)
