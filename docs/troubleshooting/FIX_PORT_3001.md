# Fix Port 3001 Already in Use Error

## What's Happening

The error `EADDRINUSE: address already in use :::3001` means another process is already using port 3001. This usually happens when:

1. **Previous server instance didn't close properly** - The server was started before and the process is still running
2. **Multiple terminal windows** - You started the server in one terminal and tried to start it again in another
3. **Background process** - The server was started in the background and is still running

## Quick Fix

### Option 1: Kill the Process Using Port 3001

**Windows PowerShell:**
```powershell
# Find what's using port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID with the number you found)
taskkill /F /PID <PID>

# Example:
taskkill /F /PID 24004
```

**Or use this one-liner:**
```powershell
Get-NetTCPConnection -LocalPort 3001 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### Option 2: Use a Different Port

Edit `server/.env` and change:
```env
PORT=3002
```

Then update frontend `.env`:
```env
VITE_API_URL=http://localhost:3002/api
```

### Option 3: Find and Kill All Node Processes

```powershell
# See all Node processes
Get-Process node

# Kill all Node processes (be careful!)
Get-Process node | Stop-Process -Force
```

## Prevention

1. **Always stop the server properly** - Press `Ctrl+C` in the terminal where the server is running
2. **Check before starting** - Run `netstat -ano | findstr :3001` to see if port is in use
3. **Use one terminal** - Don't start the server in multiple terminals

## Verify Port is Free

After killing the process, verify:
```powershell
netstat -ano | findstr :3001
```

If nothing shows up, the port is free!

## Then Start Server

```powershell
cd server
npm run dev
```

You should see:
```
✅ MySQL database connected successfully
🚀 Server running on http://localhost:3001
```

