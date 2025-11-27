import { type UserRole } from '@/lib/supabase';

export const HOME_BY_ROLE: Record<UserRole, string> = {
  ceo_admin: '/',
  purchaser: '/',
  finance_admin: '/',
  warehouse_admin: '/warehouse/pending-claims',
  onsite_team: '/onsite/projects',
};

