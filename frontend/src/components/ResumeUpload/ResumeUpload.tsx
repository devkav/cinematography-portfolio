import "./resume-upload.css";

import { useEffect, useState, type ChangeEvent, type DragEvent } from "react";
import { MdClose, MdOpenInNew, MdPictureAsPdf, MdUploadFile } from "react-icons/md";
import { useAuth } from "../../auth/AuthContext";
import { putFile } from "../../upload/putFile";

const API_URL = import.meta.env.VITE_API_URL;
const RESUME_URL = `${import.meta.env.VITE_SITE_URL}/resume.pdf`;
const MAX_RESUME_BYTES = 10 * 1024 * 1024;

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export default function ResumeUpload() {
  const { idToken } = useAuth();
  const [lastModified, setLastModified] = useState<Date | null>();
  const [file, setFile] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string }>();

  useEffect(() => {
    fetch(RESUME_URL, { method: "HEAD", cache: "no-store" })
      .then((response) => {
        const header = response.ok ? response.headers.get("Last-Modified") : null;
        setLastModified(header ? new Date(header) : null);
      })
      .catch(() => setLastModified(null));
  }, []);

  useEffect(() => {
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
      setPreviewUrl(undefined);
    };
  }, [file]);

  const selectFile = (selected: File | undefined) => {
    setStatus(undefined);
    setProgress(0);

    if (!selected) return;

    if (selected.type !== "application/pdf") {
      setFile(undefined);
      setStatus({ kind: "error", message: "Résumé must be a PDF." });
      return;
    }

    if (selected.size > MAX_RESUME_BYTES) {
      setFile(undefined);
      setStatus({ kind: "error", message: "Résumé must be under 10 MB." });
      return;
    }

    setFile(selected);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };

  const upload = async () => {
    if (!file || !idToken) return;

    setUploading(true);
    setProgress(0);
    setStatus(undefined);

    try {
      const urlResponse = await fetch(`${API_URL}/uploads`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: idToken },
        body: JSON.stringify({ page: "resume", contentType: file.type })
      });

      if (!urlResponse.ok) {
        throw new Error(`could not get upload URL (${urlResponse.status})`);
      }

      const { url, key } = await urlResponse.json();

      await putFile(url, file, setProgress);
      setProgress(file.size);

      const saveResponse = await fetch(`${API_URL}/upload_asset`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: idToken },
        body: JSON.stringify({ page: "resume", key })
      });

      if (!saveResponse.ok) {
        const { error } = await saveResponse.json().catch(() => ({ error: undefined }));
        throw new Error(error ?? `could not publish résumé (${saveResponse.status})`);
      }

      setFile(undefined);
      setLastModified(new Date());
      setStatus({
        kind: "success",
        message: "Résumé updated. The new version can take a few minutes to appear on the site."
      });
    } catch (err) {
      setStatus({ kind: "error", message: `Upload failed: ${err instanceof Error ? err.message : "unknown error"}` });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="resume-upload">
      <section className="admin-card">
        <div className="resume-current">
          <MdPictureAsPdf className="resume-current-icon" />
          <div>
            <p className="admin-card-title">Current résumé</p>
            <p className="admin-card-subtitle">
              {lastModified === undefined && "Checking…"}
              {lastModified === null && "Last updated date unavailable"}
              {lastModified && `Last updated ${dateFormat.format(lastModified)}`}
            </p>
          </div>
          <a className="admin-button-secondary" href={RESUME_URL} target="_blank" rel="noreferrer">
            Open <MdOpenInNew />
          </a>
        </div>
      </section>

      <section className="admin-card">
        <p className="admin-card-title">Replace résumé</p>
        <p className="admin-card-subtitle">The uploaded PDF replaces the résumé linked from the Contact page.</p>

        <label
          className={`admin-dropzone resume-dropzone${dragging ? " dragging" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input
            type="file"
            accept="application/pdf"
            disabled={uploading}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              selectFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <MdUploadFile className="admin-dropzone-icon" />
          <span className="admin-dropzone-text">Drop a PDF here or click to choose</span>
          <span className="admin-card-subtitle">PDF up to 10 MB</span>
        </label>

        {file && (
          <div className="resume-selected">
            <MdPictureAsPdf className="resume-selected-icon" />
            <div className="resume-selected-text">
              <p className="resume-selected-name">{file.name}</p>
              <p className="admin-card-subtitle">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            {!uploading && (
              <button className="resume-remove" onClick={() => setFile(undefined)} aria-label="Remove file">
                <MdClose />
              </button>
            )}
          </div>
        )}

        {previewUrl && <iframe className="resume-preview" src={previewUrl} title="Selected résumé preview" />}

        {uploading && file && (
          <div className="admin-progress resume-spaced">
            <progress value={progress} max={file.size} />
            <span>{Math.round((progress / file.size) * 100)}%</span>
          </div>
        )}

        {status && <p className={`admin-status resume-spaced ${status.kind}`}>{status.message}</p>}

        <button className="admin-button resume-upload-button" onClick={upload} disabled={!file || uploading}>
          {uploading ? "Uploading…" : "Upload résumé"}
        </button>
      </section>
    </div>
  );
}
