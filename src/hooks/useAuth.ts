import { useState, useEffect } from 'react';
import { SERVICE_URLS } from '@/config/apiConfig';

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

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${SERVICE_URLS.AUTH}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const user = await response.json();
        setUser(user);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return { user, isLoading, login, logout };
};
