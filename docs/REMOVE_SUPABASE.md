# Complete Supabase Removal Guide

## ✅ What Has Been Done

1. **Removed Supabase package** from `package.json`
2. **Fixed CORS configuration** to allow all origins properly
3. **Added notification creation** to API client (notifications are created automatically by backend, but method is available)
4. **All hooks migrated** to use MySQL backend API

## 🚀 Next Steps

### Step 1: Uninstall Supabase Package

Run this command in your project root:

```bash
npm uninstall @supabase/supabase-js
```

Or if you're using yarn:

```bash
yarn remove @supabase/supabase-js
```

### Step 2: Remove Environment Variables (Optional)

If you have a `.env` file with Supabase variables, you can remove these lines:

```env
# Remove these if not using Supabase Storage
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

**Note:** If you're still using Supabase Storage for photos, keep these variables.

### Step 3: Restart Backend Server

Make sure your backend server is running on port 3001:

```bash
cd server
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3001
📊 Health check: http://localhost:3001/health
```

### Step 4: Test the Application

1. **Start frontend:**
   ```bash
   npm run dev
   ```

2. **Check browser console** - You should no longer see Supabase-related errors

3. **Test API calls:**
   - Open browser DevTools → Network tab
   - Check that requests to `http://localhost:3001/api/*` are successful
   - No more CORS errors

## 🔧 Troubleshooting

### CORS Errors Still Appearing?

1. **Check backend is running:**
   ```bash
   curl http://localhost:3001/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Check CORS headers:**
   - Open DevTools → Network tab
   - Click on a failed request
   - Check Response Headers for `Access-Control-Allow-Origin`

3. **Restart backend server** after CORS changes

### "Module not found: @supabase/supabase-js"

This means the package is still referenced somewhere. Check:

1. **Remove from package.json** (already done ✅)
2. **Run `npm install`** to update node_modules
3. **Clear build cache:**
   ```bash
   rm -rf node_modules/.vite
   rm -rf dist
   ```

### Backend Not Starting?

1. **Check MySQL is running** (XAMPP)
2. **Check database connection** in `server/.env`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=leadtime_lense
   ```

3. **Check port 3001 is available:**
   ```bash
   # Windows PowerShell
   netstat -ano | findstr :3001
   
   # If port is in use, kill the process:
   taskkill /PID <PID> /F
   ```

## 📋 Verification Checklist

- [ ] Supabase package removed from `package.json`
- [ ] Ran `npm uninstall @supabase/supabase-js`
- [ ] Backend server running on port 3001
- [ ] Frontend can connect to backend (no CORS errors)
- [ ] All API calls working (inventory, projects, claims, etc.)
- [ ] No Supabase import errors in console
- [ ] Application loads without white screen

## 🎯 What's Left

The `src/lib/supabase.ts` file still exists but **only contains TypeScript types**. This is fine - you can keep it for type definitions, or move types to a separate `types.ts` file if you prefer.

**All actual Supabase client code has been removed** - the application now uses the MySQL backend API exclusively.

## 📝 Notes

- **Photo Uploads:** Currently using base64 data URLs. If you need file storage, consider:
  - AWS S3
  - Cloudinary
  - Local file storage with Express
  - Keep Supabase Storage (only storage, not database)

- **Notifications:** Created automatically by backend when claims/returns are created. No need to create them manually from frontend.

- **Authentication:** Currently using role-based headers (`x-user-role`, `x-user-name`). Consider implementing proper JWT authentication later.

