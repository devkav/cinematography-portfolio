import "./file-upload.css";

import { useEffect, useRef, useState } from "react";
import { MdAddPhotoAlternate, MdCheck, MdClose, MdErrorOutline } from "react-icons/md";
import { useAuth } from "../../auth/AuthContext";
import { uploadFile } from "../../upload/uploadFile";

const API_URL = import.meta.env.VITE_API_URL;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const CONCURRENCY = 4;
const UPLOAD_WEIGHT = 0.8;

type UploadStatus = "queued" | "uploading" | "optimizing" | "done" | "failed";

interface UploadItem {
  id: string;
  file: File;
  preview: string;
  status: UploadStatus;
  loaded: number;
  error?: string;
}

interface Props {
  collection: string;
  folder: string;
  disabled?: boolean;
  onComplete?: (photoIds: string[]) => void;
}

const STATUS_LABELS: Record<UploadStatus, string> = {
  queued: "Waiting",
  uploading: "Uploading",
  optimizing: "Optimizing",
  done: "Done",
  failed: "Failed"
};

export default function FileUpload({ collection, folder, disabled, onComplete }: Props) {
  const { idToken } = useAuth();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [running, setRunning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const photoIds = useRef(new Map<string, string>());
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => () => itemsRef.current.forEach((item) => URL.revokeObjectURL(item.preview)), []);

  const update = (id: string, changes: Partial<UploadItem>) =>
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...changes } : item)));

  const selectFiles = (selected: FileList | null) => {
    if (running || disabled) return;

    const accepted = Array.from(selected ?? []).filter((file) => ACCEPTED_TYPES.includes(file.type));

    setItems((current) => [
      ...current,
      ...accepted.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        status: "queued" as UploadStatus,
        loaded: 0
      }))
    ]);
  };

  const remove = (id: string) =>
    setItems((current) => {
      const item = current.find((i) => i.id === id);

      if (item) URL.revokeObjectURL(item.preview);

      return current.filter((i) => i.id !== id);
    });

  const clear = () => {
    items.forEach((item) => URL.revokeObjectURL(item.preview));
    photoIds.current.clear();
    setItems([]);
  };

  const process = async (item: UploadItem) => {
    if (!idToken) return;

    update(item.id, { status: "uploading", loaded: 0, error: undefined });

    try {
      const key = await uploadFile(idToken, "photo", item.file, (loaded) => update(item.id, { loaded }), { folder });

      update(item.id, { status: "optimizing", loaded: item.file.size });

      const response = await fetch(`${API_URL}/upload_asset`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: idToken },
        body: JSON.stringify({ page: "photo", key, collection, folder })
      });

      if (!response.ok) {
        const { error } = await response.json().catch(() => ({ error: undefined }));
        throw new Error(error ?? `could not save photo (${response.status})`);
      }

      const { id } = await response.json();
      photoIds.current.set(item.id, id);
      update(item.id, { status: "done" });
    } catch (err) {
      update(item.id, { status: "failed", error: err instanceof Error ? err.message : "Upload failed" });
    }
  };

  const start = async () => {
    const queue = items.filter((item) => item.status === "queued" || item.status === "failed");

    if (!queue.length) return;

    setRunning(true);
    let next = 0;

    const worker = async () => {
      while (next < queue.length) {
        await process(queue[next++]);
      }
    };

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));

    setRunning(false);
    onComplete?.(
      itemsRef.current.map((item) => photoIds.current.get(item.id)).filter((id): id is string => Boolean(id))
    );
  };

  const totalBytes = items.reduce((sum, item) => sum + item.file.size, 0);
  const uploadedBytes = items.reduce((sum, item) => sum + item.loaded, 0);
  const counts = items.reduce((acc, item) => ({ ...acc, [item.status]: acc[item.status] + 1 }), {
    queued: 0,
    uploading: 0,
    optimizing: 0,
    done: 0,
    failed: 0
  } as Record<UploadStatus, number>);
  const pending = counts.queued + counts.failed;
  const percent = items.length
    ? Math.round(
        ((totalBytes ? uploadedBytes / totalBytes : 0) * UPLOAD_WEIGHT +
          (counts.done / items.length) * (1 - UPLOAD_WEIGHT)) *
          100
      )
    : 0;

  const summary = running
    ? `${counts.done} of ${items.length} done${counts.optimizing ? ` · ${counts.optimizing} optimizing` : ""}${
        counts.uploading ? ` · ${counts.uploading} uploading` : ""
      }`
    : counts.failed
      ? `${counts.done} uploaded · ${counts.failed} failed`
      : counts.done === items.length
        ? `${counts.done} photo${counts.done === 1 ? "" : "s"} uploaded`
        : `${items.length} photo${items.length === 1 ? "" : "s"} selected · ${(totalBytes / 1024 / 1024).toFixed(1)} MB`;

  return (
    <div className="file-upload">
      <label
        className={`admin-dropzone${dragging ? " dragging" : ""}${disabled || running ? " disabled" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(!disabled && !running);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          selectFiles(event.dataTransfer.files);
        }}
      >
        <input
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          disabled={running || disabled}
          onChange={(event) => {
            selectFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <MdAddPhotoAlternate className="admin-dropzone-icon" />
        <span className="admin-dropzone-text">
          {items.length ? "Drop more photos or click to add" : "Drop photos here or click to choose"}
        </span>
        <span className="admin-card-subtitle">JPEG, PNG, WebP or AVIF · uploads {CONCURRENCY} at a time</span>
      </label>

      {items.length > 0 && (
        <div className="file-upload-batch">
          <div className="file-upload-summary">
            <span>{summary}</span>
            {(running || counts.done > 0) && <span className="file-upload-percent">{percent}%</span>}
          </div>
          {(running || counts.done > 0) && (
            <div className="file-upload-track">
              <div
                className={`file-upload-fill${counts.failed && !running ? " has-failures" : ""}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          )}

          <div className="file-upload-grid">
            {items.map((item) => (
              <div className={`file-upload-tile ${item.status}`} key={item.id} title={item.error ?? item.file.name}>
                <img src={item.preview} alt="" loading="lazy" decoding="async" />
                <span className="file-upload-tile-status">
                  {item.status === "done" && <MdCheck />}
                  {item.status === "failed" && <MdErrorOutline />}
                  {item.status === "uploading"
                    ? `${Math.round((item.loaded / item.file.size) * 100)}%`
                    : STATUS_LABELS[item.status]}
                </span>
                {item.status === "uploading" && (
                  <span
                    className="file-upload-tile-bar"
                    style={{ width: `${(item.loaded / item.file.size) * 100}%` }}
                  />
                )}
                {!running && (item.status === "queued" || item.status === "failed") && (
                  <button
                    className="file-upload-tile-remove"
                    aria-label={`Remove ${item.file.name}`}
                    onClick={() => remove(item.id)}
                  >
                    <MdClose />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="file-upload-actions">
            {!running && (
              <button className="admin-button-secondary" onClick={clear}>
                Clear
              </button>
            )}
            {(running || pending > 0) && (
              <button className="admin-button" onClick={start} disabled={running || disabled || !pending}>
                {running
                  ? "Uploading…"
                  : counts.queued
                    ? `Upload ${pending} photo${pending === 1 ? "" : "s"}`
                    : `Retry ${pending} failed`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
