import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { USER_ROLES, type UserRole } from '@/lib/supabase';

interface RoleContextType {
  currentRole: UserRole;
  actualRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  setActualRole: (role: UserRole) => void;
  isPreviewMode: boolean;
  userName: string;
  setUserName: (name: string) => void;
  exitPreviewMode: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const ROLE_STORAGE_KEY = 'inventory_user_role';
const ACTUAL_ROLE_STORAGE_KEY = 'inventory_actual_role';
const USER_NAME_STORAGE_KEY = 'inventory_user_name';
const PREVIEW_ROLE_STORAGE_KEY = 'inventory_preview_role';
const PREVIEW_MODE_STORAGE_KEY = 'inventory_is_preview_mode';

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

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [currentRole, setCurrentRoleState] = useState<UserRole>('ceo_admin');
  const [actualRole, setActualRoleState] = useState<UserRole>('ceo_admin');
  const [userName, setUserNameState] = useState<string>('CEO Admin');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedActualRole = readStoredRole(ACTUAL_ROLE_STORAGE_KEY, 'ceo_admin');
    const storedUserRole = readStoredRole(ROLE_STORAGE_KEY, storedActualRole);
    const storedPreviewRole = readStoredRole(PREVIEW_ROLE_STORAGE_KEY, storedUserRole);
    const previewMode = readStoredBoolean(PREVIEW_MODE_STORAGE_KEY);

    setActualRoleState(storedActualRole);
    setCurrentRoleState(previewMode ? storedPreviewRole : storedUserRole);
    setUserNameState(readStoredString(USER_NAME_STORAGE_KEY, 'CEO Admin'));
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

  const contextValue: RoleContextType = {
    currentRole,
    actualRole,
    setCurrentRole,
    setActualRole,
    isPreviewMode: currentRole !== actualRole,
    userName,
    setUserName,
    exitPreviewMode,
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
