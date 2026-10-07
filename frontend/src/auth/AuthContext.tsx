import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CognitoIdToken } from "amazon-cognito-identity-js";

import { getStoredSession, signOut } from "./cognito";

const REFRESH_MARGIN_MS = 5 * 60 * 1000;

interface AuthState {
  username: string | null;
  idToken: string | null;
  restoring: boolean;
  setAuth: (username: string, idToken: string) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);

  const setAuth = (newUsername: string, newIdToken: string) => {
    setUsername(newUsername);
    setIdToken(newIdToken);
  };

  const clearAuth = () => {
    setUsername(null);
    setIdToken(null);
  };

  useEffect(() => {
    getStoredSession()
      .then((session) => {
        if (session) setAuth(session.username, session.idToken);
      })
      .finally(() => setRestoring(false));
  }, []);

  useEffect(() => {
    if (!idToken) return;

    const expiresAt = new CognitoIdToken({ IdToken: idToken }).getExpiration() * 1000;

    const timer = setTimeout(
      () =>
        getStoredSession(true).then((session) => {
          if (session) {
            setAuth(session.username, session.idToken);
          } else {
            signOut();
            clearAuth();
          }
        }),
      Math.max(expiresAt - Date.now() - REFRESH_MARGIN_MS, 0)
    );

    return () => clearTimeout(timer);
  }, [idToken]);

  return (
    <AuthContext.Provider value={{ username, idToken, restoring, setAuth, clearAuth }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
