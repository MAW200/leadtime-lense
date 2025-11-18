# Migration Steps: Supabase → MySQL

Follow these steps to migrate your application from Supabase to MySQL.

## Prerequisites

1. ✅ MySQL database created and running
2. ✅ Schema imported (`mysql_schema.sql`)
3. ✅ Backend API server created (in `server/` folder)

## Step 1: Set Up Backend API

### 1.1 Install Backend Dependencies

```bash
cd server
npm install
```

### 1.2 Configure Environment Variables

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your MySQL credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=leadtime_lense
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

### 1.3 Start Backend Server

```bash
cd server
npm run dev
```

Verify it's running:
```bash
curl http://localhost:3001/health
```

## Step 2: Update Frontend Configuration

### 2.1 Add API URL to Frontend Environment

Create or update `.env` in the root directory:

```env
VITE_API_URL=http://localhost:3001/api
```

### 2.2 Install Frontend Dependencies (if needed)

The frontend should already have `@tanstack/react-query` which we'll use.

## Step 3: Update Frontend Code

### 3.1 Replace Supabase Client with API Client

The new API client is already created in `src/lib/api.ts`. Now update your hooks to use it.

### 3.2 Example: Update `useInventory.ts`

**Before (Supabase):**
```typescript
import { supabase } from '@/lib/supabase';

export const useInventory = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase.from('inventory_items').select('*');
      if (error) throw error;
      return data;
    },
  });
};
```

**After (API):**
```typescript
import { api } from '@/lib/api';

export const useInventory = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.inventory.getAll(),
  });
};
```

### 3.3 Example: Update `useClaims.ts`

**Before:**
```typescript
const { data: claimNumberData } = await supabase.rpc('generate_claim_number');
const { data: claim } = await supabase.from('claims').insert({...}).select().single();
```

**After:**
```typescript
const claim = await api.claims.create({
  projectId: params.projectId,
  onsiteUserId: params.onsiteUserId,
  onsiteUserName: params.onsiteUserName,
  photoUrl: params.photoUrl,
  items: params.items,
  claimType: params.claimType,
  emergencyReason: params.emergencyReason,
});
```

## Step 4: Update All Hooks

You need to update these hooks to use the API client:

- [ ] `src/hooks/useInventory.ts`
- [ ] `src/hooks/useProjects.ts`
- [ ] `src/hooks/useClaims.ts`
- [ ] `src/hooks/useReturns.ts`
- [ ] `src/hooks/useStockAdjustments.ts`
- [ ] `src/hooks/useNotifications.ts`
- [ ] `src/hooks/useProjectTemplates.ts`
- [ ] `src/hooks/useProjectMaterials.ts`
- [ ] `src/hooks/useRequests.ts` (if still using)
- [ ] `src/hooks/usePurchaseOrders.ts` (if still using)
- [ ] `src/hooks/useAuditLogs.ts` (if still using)

## Step 5: Remove Supabase Dependencies

### 5.1 Remove Supabase Package

```bash
npm uninstall @supabase/supabase-js
```

### 5.2 Update `src/lib/supabase.ts`

You can either:
- **Option A**: Delete the file and remove all imports
- **Option B**: Keep it for type definitions only (remove the `createClient` part)

**Recommended**: Keep types, remove client:

```typescript
// Keep only type definitions
export const USER_ROLES = ['ceo_admin', 'warehouse_admin', 'onsite_team'] as const;
export type UserRole = (typeof USER_ROLES)[number];

// ... keep all type definitions ...

// Remove: import { createClient } from '@supabase/supabase-js';
// Remove: export const supabase = createClient(...);
```

## Step 6: Update Environment Variables

### 6.1 Remove Supabase Variables

Remove from `.env`:
```env
# Remove these:
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### 6.2 Add API URL

Add to `.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

## Step 7: Test the Migration

### 7.1 Start Both Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 7.2 Test Key Features

- [ ] ✅ View inventory items
- [ ] ✅ View projects
- [ ] ✅ Create a claim
- [ ] ✅ Approve/deny a claim
- [ ] ✅ View notifications
- [ ] ✅ Create stock adjustment
- [ ] ✅ View project templates

## Step 8: Handle Photo Uploads

If you're using Supabase Storage for photos, you'll need to:

1. **Option A**: Use a different storage service (AWS S3, Cloudinary, etc.)
2. **Option B**: Store photos in your MySQL database (not recommended for large files)
3. **Option C**: Set up local file storage

Update `PhotoUpload.tsx` component accordingly.

## Step 9: Production Deployment

### 9.1 Backend Deployment

Deploy the `server/` folder to:
- Heroku
- Railway
- DigitalOcean
- AWS EC2
- Any Node.js hosting

### 9.2 Environment Variables

Set production environment variables:
- `DB_HOST` - Your MySQL host
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `CORS_ORIGIN` - Your frontend URL
- `JWT_SECRET` - Strong random secret

### 9.3 Frontend Deployment

Update `VITE_API_URL` to your production API URL.

## Troubleshooting

### Backend won't start
- Check MySQL is running
- Verify `.env` file exists and has correct values
- Check port 3001 is available

### CORS errors
- Update `CORS_ORIGIN` in `server/.env`
- Ensure frontend URL matches exactly

### Database connection errors
- Verify MySQL credentials
- Check database exists
- Ensure MySQL user has proper permissions

### API calls failing
- Check backend is running (`curl http://localhost:3001/health`)
- Verify `VITE_API_URL` in frontend `.env`
- Check browser console for errors

## Next Steps

1. ✅ Complete hook migrations
2. ✅ Test all features
3. ✅ Set up production database
4. ✅ Deploy backend API
5. ✅ Deploy frontend
6. ✅ Monitor for errors

## Support

If you encounter issues:
1. Check server logs (`server/` terminal)
2. Check browser console
3. Verify API endpoints with `curl` or Postman
4. Check MySQL connection

