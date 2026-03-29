"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminContextType {
  isAdmin: boolean;
  apiKey: string | null;
  setApiKey: (key: string | null, options?: { verified?: boolean }) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);
let adminValidationState: { key: string; promise: Promise<boolean> } | null = null;

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Load API key from localStorage on mount
    const storedKey = localStorage.getItem('admin_api_key');
    if (storedKey) {
      setApiKeyState(storedKey);
      validateApiKey(storedKey);
    }
  }, []);

  const validateApiKey = async (key: string) => {
    if (!adminValidationState || adminValidationState.key !== key) {
      adminValidationState = {
        key,
        promise: fetch('/api/tabs/pending', {
          headers: {
            'x-api-key': key
          }
        })
          .then((response) => response.ok)
          .finally(() => {
            if (adminValidationState?.key === key) {
              adminValidationState = null;
            }
          })
      };
    }

    try {
      // Test the API key by making a request to the pending tabs endpoint
      const authenticated = await adminValidationState.promise;
      setIsAdmin(authenticated);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const setApiKey = (key: string | null, options?: { verified?: boolean }) => {
    setApiKeyState(key);
    if (key) {
      localStorage.setItem('admin_api_key', key);
      if (options?.verified) {
        setIsAdmin(true);
      } else {
        validateApiKey(key);
      }
    } else {
      localStorage.removeItem('admin_api_key');
      setIsAdmin(false);
    }
  };

  return (
    <AdminContext.Provider value={{ isAdmin, apiKey, setApiKey }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
