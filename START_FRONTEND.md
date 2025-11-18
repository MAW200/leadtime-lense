# How to Start the Frontend

## 🚀 Quick Start

The frontend server is **not running**. You need to start it manually.

### Step 1: Open a New Terminal

Open a **new terminal/PowerShell window** (keep the backend terminal running).

### Step 2: Navigate to Project Root

```powershell
cd "W:\Actual Work\Inv Mod\leadtime-lense"
```

### Step 3: Start Frontend Server

```powershell
npm run dev
```

### Step 4: Wait for Server to Start

You should see output like:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
```

### Step 5: Open Browser

Open your browser and go to:
```
http://localhost:8080
```

---

## 📊 Both Servers Must Be Running

### Terminal 1: Backend (Port 3001)
```powershell
cd server
npm run dev
```
**Status:** ✅ Should already be running

### Terminal 2: Frontend (Port 8080)
```powershell
cd "W:\Actual Work\Inv Mod\leadtime-lense"
npm run dev
```
**Status:** ⚠️ You need to start this

---

## 🔍 Troubleshooting

### Port 8080 Already in Use

If you see an error about port 8080 being in use:

**Option 1: Kill the process**
```powershell
# Find process using port 8080
netstat -ano | findstr :8080

# Kill it (replace <PID> with actual process ID)
taskkill /PID <PID> /F
```

**Option 2: Use a different port**
Edit `vite.config.ts`:
```typescript
server: {
  port: 5173, // Change to different port
}
```

### Frontend Starts But Shows Errors

- Make sure backend is running on port 3001
- Check browser console for specific errors
- Verify database is connected

### "Cannot find module" Errors

Install dependencies:
```powershell
npm install
```

---

## ✅ Verification

After starting frontend:

1. **Check terminal output** - Should show `http://localhost:8080`
2. **Open browser** - Go to `http://localhost:8080`
3. **Check console** - Should connect to backend API

---

## 📝 Summary

- **Frontend:** Not running → Start with `npm run dev`
- **Backend:** Should be running on port 3001
- **URL:** `http://localhost:8080` (after starting frontend)

Start the frontend server and you'll see your application! 🎉

