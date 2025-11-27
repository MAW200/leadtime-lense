import type { UserRole } from '@/lib/supabase';

export type MockUserProfile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export const MOCK_USER_PROFILES: MockUserProfile[] = [
  { id: 'user-ceo', name: 'CEO Admin', email: 'ceo@example.com', role: 'ceo_admin' },
  { id: 'user-warehouse', name: 'Warehouse Admin', email: 'warehouse@example.com', role: 'warehouse_admin' },
  { id: 'user-onsite', name: 'Onsite Coordinator', email: 'onsite@example.com', role: 'onsite_team' },
  { id: 'user-onsite-2', name: 'Field Engineer', email: 'field.engineer@example.com', role: 'onsite_team' },
  { id: 'user-onsite-3', name: 'Install Lead', email: 'install.lead@example.com', role: 'onsite_team' },
];

export const ONSITE_TEAM_MEMBERS = MOCK_USER_PROFILES.filter((profile) => profile.role === 'onsite_team');

