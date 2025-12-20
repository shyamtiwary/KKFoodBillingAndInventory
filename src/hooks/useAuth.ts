import { useState, useEffect } from 'react';
import { SERVICE_URLS } from '@/config/apiConfig';
import { Capacitor } from '@capacitor/core';
import { databaseService } from '@/lib/db/database';

export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
  email: string;
  role: UserRole;
  name: string;
  isApproved: boolean;
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

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      // Try Online Login First
      const response = await fetch(`${SERVICE_URLS.AUTH}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));

        // Sync to SQLite for future offline access
        if (Capacitor.isNativePlatform()) {
          try {
            await databaseService.run(
              `INSERT OR REPLACE INTO users (email, name, role, password, isApproved) VALUES (?, ?, ?, ?, ?)`,
              [userData.email, userData.name, userData.role, password, userData.isApproved ? 1 : 0]
            );
          } catch (dbError) {
            console.error("Failed to sync user to SQLite:", dbError);
          }
        }

        return { success: true };
      } else if (response.status === 403) {
        return { success: false, message: 'Account pending approval' };
      } else if (response.status === 401) {
        return { success: false, message: 'Invalid email or password' };
      }

      throw new Error("Server error");

    } catch (error) {
      console.error('Login error:', error);

      // Offline/Native Fallback
      if (Capacitor.isNativePlatform()) {
        try {
          const localUsers = await databaseService.query(
            `SELECT * FROM users WHERE email = ? AND password = ?`,
            [email, password]
          );

          if (localUsers.length > 0) {
            const localUser = localUsers[0];
            if (localUser.isApproved === 0) {
              return { success: false, message: 'Account pending approval' };
            }

            const userData: User = {
              email: localUser.email,
              name: localUser.name,
              role: localUser.role as UserRole,
              isApproved: localUser.isApproved === 1
            };
            setUser(userData);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
            return { success: true };
          }
        } catch (dbError) {
          console.error("SQLite auth check failed:", dbError);
        }
      }

      // Final fallback for demo/dev
      if (password === 'password') {
        let role: UserRole = 'staff';
        if (email.toLowerCase() === 'admin') role = 'admin';
        if (email.toLowerCase() === 'manager') role = 'manager';

        if (['admin', 'manager', 'staff'].includes(email.toLowerCase())) {
          const mockUser: User = {
            email,
            name: email.charAt(0).toUpperCase() + email.slice(1),
            role,
            isApproved: true
          };
          setUser(mockUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
          return { success: true };
        }
      }

      return { success: false, message: 'Server connection failed' };
    }
  };

  const register = async (email: string, password: string, name: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${SERVICE_URLS.AUTH}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (response.ok) {
        return { success: true, message: 'Registration successful. Waiting for admin approval.' };
      } else {
        const error = await response.text();
        return { success: false, message: error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Server connection failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return { user, isLoading, login, register, logout };
};
