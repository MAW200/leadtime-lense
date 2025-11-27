import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { USER_ROLES, ROLE_PERMISSIONS, type UserRole } from '@/lib/supabase';

interface RoleContextType {
  // Current active role (may be preview)
  currentRole: UserRole;
  // Actual logged-in role
  actualRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  setActualRole: (role: UserRole) => void;
  isPreviewMode: boolean;
  exitPreviewMode: () => void;
  
  // User info
  userId: string;
  setUserId: (id: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  setUserProfile: (profile: { role: UserRole; userId: string; userName: string; userEmail: string }) => void;
  
  // Permission helpers (based on currentRole)
  isPurchaser: boolean;
  isFinance: boolean;
  isWarehouse: boolean;
  isOnsite: boolean;
  isAdmin: boolean;
  canAccessPurchasing: boolean;
  canAccessFinance: boolean;
  canAccessWarehouse: boolean;
  canAccessOnsite: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const ROLE_STORAGE_KEY = 'inventory_user_role';
const ACTUAL_ROLE_STORAGE_KEY = 'inventory_actual_role';
const USER_ID_STORAGE_KEY = 'inventory_user_id';
const USER_NAME_STORAGE_KEY = 'inventory_user_name';
const USER_EMAIL_STORAGE_KEY = 'inventory_user_email';
const PREVIEW_ROLE_STORAGE_KEY = 'inventory_preview_role';
const PREVIEW_MODE_STORAGE_KEY = 'inventory_is_preview_mode';

const DEFAULT_USER_PROFILES: Record<UserRole, { id: string; name: string; email: string }> = {
  ceo_admin: {
    id: 'user-ceo',
    name: 'CEO Admin',
    email: 'ceo@example.com',
  },
  purchaser: {
    id: 'user-purchaser',
    name: 'Procurement Manager',
    email: 'purchaser@example.com',
  },
  finance_admin: {
    id: 'user-finance',
    name: 'Finance Manager',
    email: 'finance@example.com',
  },
  warehouse_admin: {
    id: 'user-warehouse',
    name: 'Warehouse Admin',
    email: 'warehouse@example.com',
  },
  onsite_team: {
    id: 'user-onsite',
    name: 'Onsite Coordinator',
    email: 'onsite@example.com',
  },
};

const isUserRole = (value: string | null): value is UserRole =>
  value !== null && USER_ROLES.includes(value as UserRole);

const readStoredRole = (key: string, fallback: UserRole): UserRole => {
  if (typeof window === 'undefined') return fallback;
  const stored = window.localStorage.getItem(key);
  return isUserRole(stored) ? stored : fallback;
};

const readStoredBoolean = (key: string): boolean => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(key) === 'true';
};

const readStoredString = (key: string, fallback: string): string => {
  if (typeof window === 'undefined') return fallback;
  return window.localStorage.getItem(key) ?? fallback;
};

const safeSetItem = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, value);
};

const safeRemoveItem = (key: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(key);
};

// Helper to calculate permissions based on role
const getPermissions = (role: UserRole) => {
  const perms = ROLE_PERMISSIONS[role];
  return {
    isPurchaser: role === 'purchaser' || role === 'ceo_admin',
    isFinance: role === 'finance_admin' || role === 'ceo_admin',
    isWarehouse: role === 'warehouse_admin' || role === 'ceo_admin',
    isOnsite: role === 'onsite_team' || role === 'ceo_admin',
    isAdmin: role === 'ceo_admin',
    canAccessPurchasing: perms.canAccessPurchasing,
    canAccessFinance: perms.canAccessFinance,
    canAccessWarehouse: perms.canAccessWarehouse,
    canAccessOnsite: perms.canAccessOnsite,
  };
};

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [currentRole, setCurrentRoleState] = useState<UserRole>('ceo_admin');
  const [actualRole, setActualRoleState] = useState<UserRole>('ceo_admin');
  const [userName, setUserNameState] = useState<string>('CEO Admin');
  const [userEmail, setUserEmailState] = useState<string>('ceo@example.com');
  const [userId, setUserIdState] = useState<string>('user-ceo');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedActualRole = readStoredRole(ACTUAL_ROLE_STORAGE_KEY, 'ceo_admin');
    const storedUserRole = readStoredRole(ROLE_STORAGE_KEY, storedActualRole);
    const storedPreviewRole = readStoredRole(PREVIEW_ROLE_STORAGE_KEY, storedUserRole);
    const previewMode = readStoredBoolean(PREVIEW_MODE_STORAGE_KEY);

    const profileFallback = DEFAULT_USER_PROFILES[storedActualRole];
    setActualRoleState(storedActualRole);
    setCurrentRoleState(previewMode ? storedPreviewRole : storedUserRole);
    setUserNameState(readStoredString(USER_NAME_STORAGE_KEY, profileFallback.name));
    setUserEmailState(readStoredString(USER_EMAIL_STORAGE_KEY, profileFallback.email));
    setUserIdState(readStoredString(USER_ID_STORAGE_KEY, profileFallback.id));
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    safeSetItem(ACTUAL_ROLE_STORAGE_KEY, actualRole);
  }, [actualRole, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    safeSetItem(ROLE_STORAGE_KEY, currentRole);
    if (currentRole !== actualRole) {
      safeSetItem(PREVIEW_MODE_STORAGE_KEY, 'true');
      safeSetItem(PREVIEW_ROLE_STORAGE_KEY, currentRole);
    } else {
      safeRemoveItem(PREVIEW_MODE_STORAGE_KEY);
      safeRemoveItem(PREVIEW_ROLE_STORAGE_KEY);
    }
  }, [actualRole, currentRole, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    safeSetItem(USER_NAME_STORAGE_KEY, userName);
  }, [isHydrated, userName]);

  useEffect(() => {
    if (!isHydrated) return;
    safeSetItem(USER_EMAIL_STORAGE_KEY, userEmail);
  }, [isHydrated, userEmail]);

  useEffect(() => {
    if (!isHydrated) return;
    safeSetItem(USER_ID_STORAGE_KEY, userId);
  }, [isHydrated, userId]);

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
  };

  const setActualRole = (role: UserRole) => {
    setActualRoleState(role);
    setCurrentRoleState(role);
    if (isHydrated) {
      safeSetItem(ACTUAL_ROLE_STORAGE_KEY, role);
      safeSetItem(ROLE_STORAGE_KEY, role);
      safeRemoveItem(PREVIEW_MODE_STORAGE_KEY);
      safeRemoveItem(PREVIEW_ROLE_STORAGE_KEY);
    }
  };

  const exitPreviewMode = () => {
    setCurrentRoleState((prev) => {
      if (prev === actualRole) return prev;
      return actualRole;
    });
    if (isHydrated) {
      safeSetItem(ROLE_STORAGE_KEY, actualRole);
      safeRemoveItem(PREVIEW_MODE_STORAGE_KEY);
      safeRemoveItem(PREVIEW_ROLE_STORAGE_KEY);
    }
  };

  const setUserName = (name: string) => {
    setUserNameState(name);
    if (isHydrated) {
      safeSetItem(USER_NAME_STORAGE_KEY, name);
    }
  };

  const setUserEmail = (email: string) => {
    setUserEmailState(email);
    if (isHydrated) {
      safeSetItem(USER_EMAIL_STORAGE_KEY, email);
    }
  };

  const setUserId = (id: string) => {
    setUserIdState(id);
    if (isHydrated) {
      safeSetItem(USER_ID_STORAGE_KEY, id);
    }
  };

  const setUserProfile = (profile: { role: UserRole; userId: string; userName: string; userEmail: string }) => {
    setActualRoleState(profile.role);
    setCurrentRoleState(profile.role);
    setUserNameState(profile.userName);
    setUserEmailState(profile.userEmail);
    setUserIdState(profile.userId);

    if (isHydrated) {
      safeSetItem(ACTUAL_ROLE_STORAGE_KEY, profile.role);
      safeSetItem(ROLE_STORAGE_KEY, profile.role);
      safeSetItem(USER_NAME_STORAGE_KEY, profile.userName);
      safeSetItem(USER_EMAIL_STORAGE_KEY, profile.userEmail);
      safeSetItem(USER_ID_STORAGE_KEY, profile.userId);
      safeRemoveItem(PREVIEW_MODE_STORAGE_KEY);
      safeRemoveItem(PREVIEW_ROLE_STORAGE_KEY);
    }
  };

  const permissions = getPermissions(currentRole);

  const contextValue: RoleContextType = {
    currentRole,
    actualRole,
    setCurrentRole,
    setActualRole,
    isPreviewMode: currentRole !== actualRole,
    userId,
    setUserId,
    userName,
    setUserName,
    userEmail,
    setUserEmail,
    setUserProfile,
    exitPreviewMode,
    ...permissions,
  };

  return <RoleContext.Provider value={contextValue}>{children}</RoleContext.Provider>;
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
