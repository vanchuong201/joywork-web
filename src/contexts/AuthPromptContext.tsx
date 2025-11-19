"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type AuthPromptContextType = {
  isOpen: boolean;
  action?: string;
  openPrompt: (action?: string) => void;
  closePrompt: () => void;
};

const AuthPromptContext = createContext<AuthPromptContextType | undefined>(undefined);

export function AuthPromptProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [action, setAction] = useState<string | undefined>();

  const openPrompt = (actionType?: string) => {
    setAction(actionType);
    setIsOpen(true);
  };

  const closePrompt = () => {
    setIsOpen(false);
    setAction(undefined);
  };

  return (
    <AuthPromptContext.Provider value={{ isOpen, action, openPrompt, closePrompt }}>
      {children}
    </AuthPromptContext.Provider>
  );
}

export function useAuthPrompt() {
  const context = useContext(AuthPromptContext);
  if (!context) {
    throw new Error("useAuthPrompt must be used within AuthPromptProvider");
  }
  return context;
}

