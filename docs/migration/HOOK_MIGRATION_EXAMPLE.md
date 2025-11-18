# Hook Migration Example

This shows you exactly how to convert hooks from Supabase to the new API client.

## Example 1: Simple Query Hook

### Before (Supabase) - `useInventory.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase, InventoryItem } from '@/lib/supabase';

export const useInventory = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('product_name', { ascending: true });
      
      if (error) throw error;
      return data as InventoryItem[];
    },
  });
};
```

### After (API) - `useInventory.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { InventoryItem } from '@/lib/supabase'; // Keep types

export const useInventory = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.inventory.getAll(),
  });
};
```

**Changes:**
- ✅ Removed `supabase` import
- ✅ Added `api` import
- ✅ Simplified `queryFn` (no error handling needed - API client handles it)
- ✅ Kept type definitions from `supabase.ts`

---

## Example 2: Query with Parameters

### Before (Supabase) - `useProjects.ts`

```typescript
export const useProjects = (status?: string) => {
  return useQuery({
    queryKey: ['projects', status],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Project[];
    },
  });
};
```

### After (API) - `useProjects.ts`

```typescript
import { api } from '@/lib/api';
import type { Project } from '@/lib/supabase';

export const useProjects = (status?: string) => {
  return useQuery({
    queryKey: ['projects', status],
    queryFn: () => api.projects.getAll(status),
  });
};
```

**Changes:**
- ✅ Much simpler - API handles filtering
- ✅ Same query key structure
- ✅ Same return type

---

## Example 3: Mutation Hook

### Before (Supabase) - `useCreateClaim.ts`

```typescript
export const useCreateClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      onsiteUserId: string;
      onsiteUserName: string;
      photoUrl: string;
      items: Array<{ productId: string; quantity: number }>;
      claimType?: 'standard' | 'emergency';
      emergencyReason?: string | null;
    }) => {
      // Generate claim number
      const { data: claimNumberData, error: numberError } = 
        await supabase.rpc('generate_claim_number');
      if (numberError) throw numberError;
      const claimNumber = claimNumberData as string;

      // Create claim
      const { data: claim, error: claimError } = await supabase
        .from('claims')
        .insert({
          claim_number: claimNumber,
          project_id: params.projectId,
          onsite_user_id: params.onsiteUserId,
          onsite_user_name: params.onsiteUserName,
          photo_url: params.photoUrl,
          status: 'pending',
          claim_type: params.claimType ?? 'standard',
          emergency_reason: params.emergencyReason || null,
        })
        .select()
        .single();

      if (claimError) throw claimError;

      // Insert claim items
      const claimItems = params.items.map((item) => ({
        claim_id: claim.id,
        product_id: item.productId,
        quantity_requested: item.quantity,
        quantity_approved: 0,
      }));

      if (claimItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('claim_items')
          .insert(claimItems);
        if (itemsError) throw itemsError;
      }

      // Create notifications (multiple calls)
      // ... more code ...

      return claim;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
    },
  });
};
```

### After (API) - `useCreateClaim.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useCreateClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      onsiteUserId: string;
      onsiteUserName: string;
      photoUrl: string;
      items: Array<{ productId: string; quantity: number }>;
      claimType?: 'standard' | 'emergency';
      emergencyReason?: string | null;
    }) => {
      // API handles everything: claim number generation, 
      // claim creation, items, notifications - all in one call!
      return api.claims.create({
        projectId: params.projectId,
        onsiteUserId: params.onsiteUserId,
        onsiteUserName: params.onsiteUserName,
        photoUrl: params.photoUrl,
        items: params.items,
        claimType: params.claimType,
        emergencyReason: params.emergencyReason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
    },
  });
};
```

**Changes:**
- ✅ Much simpler - API handles all the complexity
- ✅ No need to call `rpc()` for claim numbers
- ✅ No need to manually insert items or notifications
- ✅ Backend handles transactions and error handling

---

## Example 4: Complex Query with Joins

### Before (Supabase) - `useClaims.ts`

```typescript
export const useClaims = (filters?: ClaimFilters) => {
  return useQuery({
    queryKey: ['claims', filters],
    queryFn: async () => {
      let query = supabase
        .from('claims')
        .select(`
          *,
          project:projects(*),
          claim_items(
            *,
            product:inventory_items(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ClaimWithItems[];
    },
  });
};
```

### After (API) - `useClaims.ts`

```typescript
import { api } from '@/lib/api';
import type { ClaimWithItems } from '@/lib/supabase';

export const useClaims = (filters?: ClaimFilters) => {
  return useQuery({
    queryKey: ['claims', filters],
    queryFn: () => api.claims.getAll(filters),
  });
};
```

**Changes:**
- ✅ Backend handles all the joins
- ✅ Data structure is the same (API returns same format)
- ✅ Much cleaner frontend code

---

## Migration Pattern Summary

### Pattern for All Hooks:

1. **Replace imports:**
   ```typescript
   // Remove
   import { supabase } from '@/lib/supabase';
   
   // Add
   import { api } from '@/lib/api';
   ```

2. **Simplify queryFn:**
   ```typescript
   // Before
   queryFn: async () => {
     const { data, error } = await supabase.from('table').select('*');
     if (error) throw error;
     return data;
   }
   
   // After
   queryFn: () => api.table.getAll()
   ```

3. **Keep types:**
   ```typescript
   // Keep importing types from supabase.ts
   import type { InventoryItem, Project } from '@/lib/supabase';
   ```

4. **Keep query keys the same:**
   ```typescript
   // Same structure
   queryKey: ['inventory', status]
   ```

## Quick Reference

| Supabase Method | API Method |
|----------------|------------|
| `supabase.from('table').select()` | `api.table.getAll()` |
| `supabase.from('table').select().eq('id', id).single()` | `api.table.getById(id)` |
| `supabase.from('table').insert(data)` | `api.table.create(data)` |
| `supabase.from('table').update(data).eq('id', id)` | `api.table.update(id, data)` |
| `supabase.rpc('function_name')` | Handled by API automatically |

## Next Steps

1. Start with simple hooks (`useInventory`, `useProjects`)
2. Move to mutations (`useCreateClaim`, `useApproveClaim`)
3. Test each hook as you migrate
4. Remove Supabase once all hooks are migrated

Good luck! 🚀

