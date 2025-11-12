import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '@/lib/supabase';

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

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => {
    const stored = localStorage.getItem(ROLE_STORAGE_KEY);
    return (stored === 'ceo_admin' || stored === 'warehouse_admin' || stored === 'onsite_team') ? stored : 'ceo_admin';
  });

  const [actualRole, setActualRoleState] = useState<UserRole>(() => {
    const stored = localStorage.getItem(ACTUAL_ROLE_STORAGE_KEY);
    return (stored === 'ceo_admin' || stored === 'warehouse_admin' || stored === 'onsite_team') ? stored : 'ceo_admin';
  });

  const [userName, setUserNameState] = useState<string>(() => {
    return localStorage.getItem(USER_NAME_STORAGE_KEY) || 'CEO Admin';
  });

  const isPreviewMode = currentRole !== actualRole;

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    localStorage.setItem(ROLE_STORAGE_KEY, role);
  };

  const setActualRole = (role: UserRole) => {
    setActualRoleState(role);
    setCurrentRoleState(role);
    localStorage.setItem(ACTUAL_ROLE_STORAGE_KEY, role);
    localStorage.setItem(ROLE_STORAGE_KEY, role);
  };

  const exitPreviewMode = () => {
    setCurrentRoleState(actualRole);
    localStorage.setItem(ROLE_STORAGE_KEY, actualRole);
  };

  const setUserName = (name: string) => {
    setUserNameState(name);
    localStorage.setItem(USER_NAME_STORAGE_KEY, name);
  };

  useEffect(() => {
    localStorage.setItem(ROLE_STORAGE_KEY, currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem(ACTUAL_ROLE_STORAGE_KEY, actualRole);
  }, [actualRole]);

  useEffect(() => {
    localStorage.setItem(USER_NAME_STORAGE_KEY, userName);
  }, [userName]);

  return (
    <RoleContext.Provider value={{ currentRole, actualRole, setCurrentRole, setActualRole, isPreviewMode, userName, setUserName, exitPreviewMode }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
