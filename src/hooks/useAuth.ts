import { useState, useEffect } from 'react';

export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
  email: string;
  role: UserRole;
  name: string;
}

const AUTH_STORAGE_KEY = 'billflow_auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth) {
      try {
        setUser(JSON.parse(storedAuth));
      } catch (error) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string): boolean => {
    // Mock authentication - replace with real auth later
    const mockUsers: Record<string, User> = {
      'admin': { email: 'admin', role: 'admin', name: 'Admin User' },
      'manager': { email: 'manager', role: 'manager', name: 'Manager User' },
      'staff': { email: 'staff', role: 'staff', name: 'Staff User' },
    };

    const user = mockUsers[email];
    if (user && password === 'password') {
      setUser(user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return { user, isLoading, login, logout };
};
