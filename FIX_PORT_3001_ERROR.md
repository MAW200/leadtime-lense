# Fix "Port 3001 Already in Use" Error

## 🔍 What the Error Means

**Error:** `EADDRINUSE: address already in use :::3001`

This means another process is already using port 3001. The backend server can't start because ports can only be used by one process at a time.

---

## ✅ Solution

### Option 1: Kill the Process Using Port 3001 (Recommended)

1. **Find the process:**

   ```powershell
   netstat -ano | findstr :3001
   ```

   You'll see something like:

   ```
   TCP    0.0.0.0:3001    LISTENING    27944
   ```

   The last number (27944) is the Process ID (PID).

2. **Kill the process:**

   ```powershell
   taskkill /PID 27944 /F
   ```

3. **Restart the backend:**
   ```powershell
   cd server
   npm run dev
   ```

### Option 2: Change the Port (If you need both running)

If you need to keep the other process running, change the backend port:

1. **Edit `server/.env`:**

   ```env
   PORT=3002  # Change from 3001 to 3002
   ```

2. **Update frontend API URL** (if needed):

   ```env
   # In root .env file
   VITE_API_URL=http://localhost:3002/api
   ```

3. **Restart both backend and frontend**

---

## 🐛 Common Causes

1. **Previous backend instance didn't close properly**

   - Solution: Kill the process and restart

2. **Multiple backend instances running**

   - Solution: Kill all instances, then start one

3. **Another application using port 3001**
   - Solution: Change backend port or kill the other application

---

## 🔧 Quick Fix Commands

```powershell
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Restart backend
cd server
npm run dev
```

---

## ✅ Verify It's Fixed

After killing the process, you should see:

```
🚀 Server running on port 3001
✅ MySQL database connected
```

If you still see the error, there might be another process. Run `netstat -ano | findstr :3001` again to check.
