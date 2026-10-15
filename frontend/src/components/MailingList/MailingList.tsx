import "./mailing-list.css";

import { useEffect, useState } from "react";
import { MdContentCopy, MdFileDownload, MdOutlineEmail } from "react-icons/md";
import { useAuth } from "../../auth/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

// Some mail apps silently drop mailto links longer than this
const MAX_MAILTO_LENGTH = 2000;

interface Signup {
  email: string;
  subscribedAt: string | null;
}

interface ProjectSignups {
  project: string;
  signups: Signup[];
}

function formatProject(project: string) {
  return project
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(timestamp: string | null) {
  if (!timestamp) return "—";

  return new Date(timestamp).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function csvField(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function downloadCsv(project: string, signups: Signup[]) {
  const rows = [
    "email,subscribed_at",
    ...signups.map(({ email, subscribedAt }) => `${csvField(email)},${subscribedAt ?? ""}`)
  ];
  const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
  const link = document.createElement("a");

  link.href = url;
  link.download = `${project}-mailing-list.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function MailingList() {
  const { idToken } = useAuth();
  const [projects, setProjects] = useState<ProjectSignups[]>();
  const [selected, setSelected] = useState<string>();
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!idToken) return;

    let cancelled = false;

    fetch(`${API_URL}/mailing-list`, { headers: { Authorization: idToken } })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        return res.json();
      })
      .then((data: { projects: ProjectSignups[] }) => {
        if (cancelled) return;

        setProjects(data.projects);
        setSelected((current) => current ?? data.projects[0]?.project);
      })
      .catch(() => !cancelled && setError(true));

    return () => {
      cancelled = true;
    };
  }, [idToken]);

  if (error) {
    return <p className="admin-status error mailing-list-message">Couldn't load the mailing list.</p>;
  }

  if (!projects) {
    return <p className="admin-status mailing-list-message">Loading…</p>;
  }

  if (projects.length === 0) {
    return <p className="admin-status mailing-list-message">No signups yet.</p>;
  }

  const current = projects.find(({ project }) => project === selected) ?? projects[0];
  const emails = current.signups.map(({ email }) => email);
  const mailto = `mailto:?bcc=${emails.map(encodeURIComponent).join(",")}`;
  const mailtoTooLong = mailto.length > MAX_MAILTO_LENGTH;

  const copyEmails = async () => {
    await navigator.clipboard.writeText(emails.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mailing-list">
      {projects.length > 1 && (
        <div className="admin-page-heading">
          <div className="admin-segmented">
            {projects.map(({ project, signups }) => (
              <button
                key={project}
                className={`admin-segmented-button${project === current.project ? " active" : ""}`}
                onClick={() => setSelected(project)}
              >
                {formatProject(project)} ({signups.length})
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="mailing-list-title">
          <div>
            <p className="admin-card-title">{formatProject(current.project)}</p>
            <p className="admin-card-subtitle">
              {current.signups.length.toLocaleString()} {current.signups.length === 1 ? "signup" : "signups"}
            </p>
          </div>
          <div className="mailing-list-actions">
            <button className="admin-button-secondary" onClick={copyEmails}>
              <MdContentCopy />
              {copied ? "Copied!" : "Copy emails"}
            </button>
            <button className="admin-button-secondary" onClick={() => downloadCsv(current.project, current.signups)}>
              <MdFileDownload />
              Download CSV
            </button>
            {!mailtoTooLong && (
              <a className="admin-button-secondary" href={mailto}>
                <MdOutlineEmail />
                Email all (BCC)
              </a>
            )}
          </div>
        </div>
        {mailtoTooLong && (
          <p className="admin-card-subtitle mailing-list-note">
            The list is too long for an email link. Use "Copy emails" and paste into the BCC field instead.
          </p>
        )}

        <div className="mailing-list-header">
          <span>Email</span>
          <span>Signed up</span>
        </div>
        {current.signups.map(({ email, subscribedAt }) => (
          <div className="mailing-list-row" key={email}>
            <span className="mailing-list-email">{email}</span>
            <span className="mailing-list-date">{formatDate(subscribedAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
