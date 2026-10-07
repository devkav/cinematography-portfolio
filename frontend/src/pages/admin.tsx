import { useState, type FormEvent } from "react";
import { CognitoUser } from "amazon-cognito-identity-js";

import { signIn, completeNewPassword, signOut } from "../auth/cognito";
import { useAuth } from "../auth/AuthContext";

import "../styles/admin.css";
import AdminDashboard from "../components/AdminDashboard/AdminDashboard";

export default function Admin() {
  const { username, idToken, restoring, setAuth, clearAuth } = useAuth();

  if (restoring) {
    return <meta name="robots" content="noindex, nofollow" />;
  }

  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      {idToken && username ? (
        <AdminDashboard
          username={username}
          onSignOut={() => {
            signOut();
            clearAuth();
          }}
        />
      ) : (
        <SignInForm onAuth={setAuth} />
      )}
    </>
  );
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
      <form onSubmit={handleSubmit} className="admin-card admin-auth-form">
        <div className="admin-auth-header">
          <p className="admin-auth-brand">Maggie Lucy</p>
          <h1>Admin</h1>
          <p className="admin-card-subtitle">Sign in to view analytics and manage uploads.</p>
          <div className="admin-auth-accent" />
        </div>
        <label className="admin-field">
          <span className="admin-label">Username</span>
          <input
            className="admin-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="admin-field">
          <span className="admin-label">Password</span>
          <input
            className="admin-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="admin-status error">{error}</p>}
        <button className="admin-button" type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
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
      <form onSubmit={handleSubmit} className="admin-card admin-auth-form">
        <div className="admin-auth-header">
          <p className="admin-auth-brand">Maggie Lucy</p>
          <h1>New password</h1>
          <p className="admin-card-subtitle">You must set a new password before continuing.</p>
          <div className="admin-auth-accent" />
        </div>
        <label className="admin-field">
          <span className="admin-label">New password</span>
          <input
            className="admin-input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <label className="admin-field">
          <span className="admin-label">Confirm password</span>
          <input
            className="admin-input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        {error && <p className="admin-status error">{error}</p>}
        <button className="admin-button" type="submit" disabled={submitting}>
          {submitting ? "Setting…" : "Set password"}
        </button>
      </form>
    </div>
  );
}
