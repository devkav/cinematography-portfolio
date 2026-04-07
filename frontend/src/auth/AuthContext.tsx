import { createContext, useContext, useState, type ReactNode } from "react";

interface AuthState {
  username: string | null;
  idToken: string | null;
  setAuth: (username: string, idToken: string) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);

  const setAuth = (newUsername: string, newIdToken: string) => {
    setUsername(newUsername);
    setIdToken(newIdToken);
  };

  const clearAuth = () => {
    setUsername(null);
    setIdToken(null);
  };

  return <AuthContext.Provider value={{ username, idToken, setAuth, clearAuth }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
