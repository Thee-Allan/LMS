import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, auditApi, usersApi } from '@/lib/api';

export type UserRole = 'super_admin' | 'managing_partner' | 'advocate' | 'paralegal' | 'accountant' | 'reception' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  title: string;
  avatar: string;
  billingRate: number;
  phone: string;
  permissions: string[];
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  timestamp: Date;
  ip: string;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  auditLogs: AuditLog[];
  addAuditLog: (action: string, module: string, details: string) => void;
  allUsers: User[];
}

const AuthContext = createContext<AuthContextType>({
  user: null, setUser: () => {}, isAuthenticated: false,
  login: async () => false, logout: () => {},
  hasPermission: () => false, hasAnyPermission: () => false,
  auditLogs: [], addAuditLog: () => {},
  allUsers: [],
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nanyuki_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    usersApi.list()
      .then((rows: object[]) => setAllUsers(rows as User[]))
      .catch(() => {
        setAllUsers([
          { id:'1', email:'admin@gmail.com',    name:'James Mwangi',  role:'super_admin',      title:'System Administrator', avatar:'JM', billingRate:0,     phone:'+254 700 100 001', permissions:['*'] },
          { id:'2', email:'owner@gmail.com',    name:'Grace Wanjiku', role:'managing_partner', title:'Managing Partner',     avatar:'GW', billingRate:15000, phone:'+254 700 100 002', permissions:[] },
          { id:'3', email:'advocate@gmail.com', name:'Peter Kamau',   role:'advocate',         title:'Senior Advocate',      avatar:'PK', billingRate:10000, phone:'+254 700 100 003', permissions:[] },
          { id:'4', email:'customer@gmail.com', name:'Mary Njeri',    role:'client',           title:'Client',               avatar:'MN', billingRate:0,     phone:'+254 700 100 004', permissions:[] },
        ]);
      });
  }, []);

  useEffect(() => {
    if (user) {
      auditApi.list()
        .then((rows: object[]) => setAuditLogs(rows as AuditLog[]))
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (user) localStorage.setItem('nanyuki_user', JSON.stringify(user));
    else localStorage.removeItem('nanyuki_user');
  }, [user]);

  const addAuditLog = useCallback((_action: string, _module: string, _details: string) => {}, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await authApi.login(email, password) as { token: string; user: User };
      localStorage.setItem('nlf_token', result.token);
      setUser(result.user);
      // Notify DataContext to re-fetch after login
      window.dispatchEvent(new Event('nlf_auth_changed'));
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('nlf_token');
    setUser(null);
    setAuditLogs([]);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(p => hasPermission(p));
  };

  return (
    <AuthContext.Provider value={{
      user, setUser, isAuthenticated: !!user, login, logout,
      hasPermission, hasAnyPermission, auditLogs, addAuditLog,
      allUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
