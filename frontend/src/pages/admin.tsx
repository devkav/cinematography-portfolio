import { useState, type FormEvent } from "react";
import { CognitoUser } from "amazon-cognito-identity-js";

import { signIn, completeNewPassword, signOut } from "../auth/cognito";
import { useAuth } from "../auth/AuthContext";

import "../styles/admin.css";
import AdminDashboard from "../components/AdminDashboard/AdminDashboard";

export default function Admin() {
  const { username, idToken, setAuth, clearAuth } = useAuth();

  if (idToken && username) {
    return (
      <AdminDashboard
        username={username}
        onSignOut={() => {
          signOut();
          clearAuth();
        }}
      />
    );
  }

  return <SignInForm onAuth={setAuth} />;
}

function SignInForm({ onAuth }: { onAuth: (username: string, idToken: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newPasswordChallenge, setNewPasswordChallenge] = useState<CognitoUser | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await signIn(username, password);
      if (result.kind === "newPasswordRequired") {
        setNewPasswordChallenge(result.cognitoUser);
      } else {
        onAuth(result.username, result.idToken);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-in failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (newPasswordChallenge) {
    return <NewPasswordForm cognitoUser={newPasswordChallenge} onAuth={onAuth} />;
  }

  return (
    <div className="admin-auth-container">
      <form onSubmit={handleSubmit} className="admin-auth-form">
        <h1>Admin</h1>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {error && <p className="admin-auth-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

function NewPasswordForm({
  cognitoUser,
  onAuth
}: {
  cognitoUser: CognitoUser;
  onAuth: (username: string, idToken: string) => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      const result = await completeNewPassword(cognitoUser, newPassword);
      onAuth(result.username, result.idToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Password change failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-auth-container">
      <form onSubmit={handleSubmit} className="admin-auth-form">
        <h1>Set New Password</h1>
        <p>You must set a new password before continuing.</p>
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        {error && <p className="admin-auth-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Setting..." : "Set Password"}
        </button>
      </form>
    </div>
  );
}

