import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '@/lib/supabase';

interface RoleContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  userName: string;
  setUserName: (name: string) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const ROLE_STORAGE_KEY = 'inventory_user_role';
const USER_NAME_STORAGE_KEY = 'inventory_user_name';

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => {
    const stored = localStorage.getItem(ROLE_STORAGE_KEY);
    return (stored === 'ceo_admin' || stored === 'warehouse_admin' || stored === 'onsite_team') ? stored : 'ceo_admin';
  });

  const [userName, setUserNameState] = useState<string>(() => {
    return localStorage.getItem(USER_NAME_STORAGE_KEY) || 'CEO Admin';
  });

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    localStorage.setItem(ROLE_STORAGE_KEY, role);
  };

  const setUserName = (name: string) => {
    setUserNameState(name);
    localStorage.setItem(USER_NAME_STORAGE_KEY, name);
  };

  useEffect(() => {
    localStorage.setItem(ROLE_STORAGE_KEY, currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem(USER_NAME_STORAGE_KEY, userName);
  }, [userName]);

  return (
    <RoleContext.Provider value={{ currentRole, setCurrentRole, userName, setUserName }}>
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
