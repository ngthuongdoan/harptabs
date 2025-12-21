"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminContextType {
  isAdmin: boolean;
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

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
    try {
      // Test the API key by making a request to the pending tabs endpoint
      const response = await fetch('/api/tabs/pending', {
        headers: {
          'x-api-key': key
        }
      });
      setIsAdmin(response.ok);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const setApiKey = (key: string | null) => {
    setApiKeyState(key);
    if (key) {
      localStorage.setItem('admin_api_key', key);
      validateApiKey(key);
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
