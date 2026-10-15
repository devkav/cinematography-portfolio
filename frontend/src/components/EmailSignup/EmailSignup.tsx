import { useState, type FormEvent } from "react";

import "./email-signup.css";

const API_URL = import.meta.env.VITE_API_URL;

type Status = "idle" | "submitting" | "success" | "error";

interface Props {
  project: string;
}

export default function EmailSignup({ project }: Props) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, email, website })
      });

      setStatus(response.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return <p className="email-signup-message">Thanks for signing up!</p>;
  }

  return (
    <form className="email-signup" onSubmit={onSubmit}>
      <div className="email-signup-row">
        <input
          className="email-signup-input"
          type="email"
          placeholder="Email address"
          aria-label="Email address"
          autoComplete="email"
          maxLength={254}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="email-signup-button" type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Signing up..." : "Sign up"}
        </button>
      </div>
      {/* Hidden from people; bots that fill it in get ignored */}
      <input
        className="email-signup-trap"
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />
      {status === "error" && <p className="email-signup-error">Something went wrong. Please try again.</p>}
    </form>
  );
}
