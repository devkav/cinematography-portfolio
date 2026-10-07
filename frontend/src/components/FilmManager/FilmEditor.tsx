import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { MdClose, MdEmojiEvents, MdMovie } from "react-icons/md";
import { useAuth } from "../../auth/AuthContext";
import { uploadFile } from "../../upload/uploadFile";
import londonLaurel from "../../assets/images/london_laurel.png";
import type { LibraryFilm } from "./FilmManager";

const API_URL = import.meta.env.VITE_API_URL;
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const LAUREL_TYPES = ["image/png", "image/webp"];
const MAX_VIDEO_BYTES = 4 * 1024 * 1024 * 1024;
const MAX_LAUREL_BYTES = 10 * 1024 * 1024;
const MAX_LAURELS = 4;

interface Props {
  film?: LibraryFilm;
  onCancel: () => void;
  onSaved: (film: LibraryFilm) => void;
}

interface PendingLaurel {
  file: File;
  preview: string;
}

const formatSize = (bytes: number) =>
  bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(2)} GB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`;

export default function FilmEditor({ film, onCancel, onSaved }: Props) {
  const { idToken } = useAuth();
  const [title, setTitle] = useState(film?.title ?? "");
  const [subtitle, setSubtitle] = useState(film?.subtitle ?? "");
  const [link, setLink] = useState(film?.link ?? "");
  const [legacyLaurel, setLegacyLaurel] = useState(film?.laurels ?? false);
  const [keptLaurels, setKeptLaurels] = useState(film?.laurelImages ?? []);
  const [newLaurels, setNewLaurels] = useState<PendingLaurel[]>([]);
  const [video, setVideo] = useState<File>();
  const [videoPreview, setVideoPreview] = useState<string>();
  const [draggingOver, setDraggingOver] = useState<"video" | "laurel">();
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<{ label: string; loaded: number; total: number }>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!video) return;

    const url = URL.createObjectURL(video);
    setVideoPreview(url);

    return () => {
      URL.revokeObjectURL(url);
      setVideoPreview(undefined);
    };
  }, [video]);

  const newLaurelsRef = useRef(newLaurels);
  newLaurelsRef.current = newLaurels;

  useEffect(() => () => newLaurelsRef.current.forEach((laurel) => URL.revokeObjectURL(laurel.preview)), []);

  const savingRef = useRef(saving);
  savingRef.current = saving;

  const close = () => {
    if (!savingRef.current) onCancel();
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const laurelCount = (legacyLaurel ? 1 : 0) + keptLaurels.length + newLaurels.length;

  const selectVideo = (file: File | undefined) => {
    setError(undefined);

    if (!file) return;

    if (!VIDEO_TYPES.includes(file.type)) {
      setError("Videos must be MP4, MOV or WebM.");
      return;
    }

    if (file.size > MAX_VIDEO_BYTES) {
      setError("Videos must be under 4 GB.");
      return;
    }

    setVideo(file);
  };

  const addLaurels = (files: FileList | null) => {
    setError(undefined);

    const accepted = Array.from(files ?? []).filter(
      (file) => LAUREL_TYPES.includes(file.type) && file.size <= MAX_LAUREL_BYTES
    );

    if (accepted.length < (files?.length ?? 0)) {
      setError("Laurels must be PNG or WebP images under 10 MB.");
    }

    const room = MAX_LAURELS - laurelCount;

    if (accepted.length > room) {
      setError(`A film can have at most ${MAX_LAURELS} laurels.`);
    }

    setNewLaurels((current) => [
      ...current,
      ...accepted.slice(0, Math.max(room, 0)).map((file) => ({ file, preview: URL.createObjectURL(file) }))
    ]);
  };

  const removeNewLaurel = (index: number) =>
    setNewLaurels((current) => {
      URL.revokeObjectURL(current[index].preview);
      return current.filter((_, i) => i !== index);
    });

  const dropHandlers = (target: "video" | "laurel") => ({
    onDragOver: (event: DragEvent) => {
      event.preventDefault();
      setDraggingOver(target);
    },
    onDragLeave: () => setDraggingOver(undefined),
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      setDraggingOver(undefined);

      if (target === "video") {
        selectVideo(event.dataTransfer.files[0]);
      } else {
        addLaurels(event.dataTransfer.files);
      }
    }
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!idToken) return;

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!film && !video) {
      setError("Choose a video for the new film.");
      return;
    }

    setSaving(true);
    setError(undefined);

    const files = [...newLaurels.map((laurel) => laurel.file), ...(video ? [video] : [])];
    const total = files.reduce((sum, file) => sum + file.size, 0);
    let completed = 0;

    try {
      const upload = async (page: string, file: File, label: string) => {
        const key = await uploadFile(idToken, page, file, (loaded) =>
          setProgress({ label, loaded: completed + loaded, total })
        );
        completed += file.size;
        return key;
      };

      const laurelKeys = [];

      for (const [index, laurel] of newLaurels.entries()) {
        laurelKeys.push(await upload("laurel", laurel.file, `Uploading laurel ${index + 1} of ${newLaurels.length}`));
      }

      const videoKey = video ? await upload("film", video, `Uploading ${video.name}`) : undefined;

      setProgress({ label: "Saving film", loaded: total, total });

      const response = await fetch(`${API_URL}/film_library`, {
        method: film ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: idToken },
        body: JSON.stringify({
          ...(film && { id: film.id, laurels: legacyLaurel, laurelImages: keptLaurels.map((laurel) => laurel.key) }),
          title,
          subtitle,
          link,
          laurelKeys,
          ...(videoKey && { videoKey })
        })
      });

      if (!response.ok) {
        const { error: message } = await response.json().catch(() => ({ error: undefined }));
        throw new Error(message ?? `could not save film (${response.status})`);
      }

      onSaved(await response.json());
    } catch (err) {
      setError(`Couldn't save the film: ${err instanceof Error ? err.message : "unknown error"}`);
      setProgress(undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="admin-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <form
        className="admin-card admin-modal film-editor"
        role="dialog"
        aria-modal="true"
        aria-label={film ? `Edit ${film.title}` : "Add a film"}
        onSubmit={submit}
      >
        <div className="film-editor-header">
          <div>
            <p className="admin-card-title">{film ? `Edit “${film.title}”` : "Add a film"}</p>
            <p className="admin-card-subtitle">
              Upload the clip already cut to length. It's optimized automatically for the web after upload.
            </p>
          </div>
          <button type="button" className="film-editor-close" aria-label="Close" onClick={onCancel} disabled={saving}>
            <MdClose />
          </button>
        </div>

        <div className="film-editor-columns">
          <div className="film-editor-fields">
            <label className="admin-field">
              <span className="admin-label">Title</span>
              <input
                className="admin-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </label>
            <label className="admin-field">
              <span className="admin-label">Subtitle</span>
              <input
                className="admin-input"
                value={subtitle}
                placeholder="(music video)"
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </label>
            <label className="admin-field">
              <span className="admin-label">Link (optional)</span>
              <input
                className="admin-input"
                type="url"
                value={link}
                placeholder="https://youtu.be/…"
                onChange={(e) => setLink(e.target.value)}
              />
              <span className="admin-card-subtitle">Clicking the clip on the Film page opens this link.</span>
            </label>

            <div className="admin-field">
              <span className="admin-label">Laurels</span>
              <div className="film-editor-laurels">
                {legacyLaurel && (
                  <div className="film-editor-laurel">
                    <img src={londonLaurel} alt="London laurel" />
                    <button type="button" aria-label="Remove laurel" onClick={() => setLegacyLaurel(false)}>
                      <MdClose />
                    </button>
                  </div>
                )}
                {keptLaurels.map((laurel) => (
                  <div className="film-editor-laurel" key={laurel.key}>
                    <img src={laurel.src} alt="Laurel" />
                    <button
                      type="button"
                      aria-label="Remove laurel"
                      onClick={() => setKeptLaurels((current) => current.filter((l) => l.key !== laurel.key))}
                    >
                      <MdClose />
                    </button>
                  </div>
                ))}
                {newLaurels.map((laurel, index) => (
                  <div className="film-editor-laurel pending" key={laurel.preview}>
                    <img src={laurel.preview} alt="New laurel" />
                    <button type="button" aria-label="Remove laurel" onClick={() => removeNewLaurel(index)}>
                      <MdClose />
                    </button>
                  </div>
                ))}
                {laurelCount < MAX_LAURELS && (
                  <label
                    className={`film-editor-laurel-add${draggingOver === "laurel" ? " dragging" : ""}`}
                    {...dropHandlers("laurel")}
                  >
                    <input
                      type="file"
                      accept={LAUREL_TYPES.join(",")}
                      multiple
                      disabled={saving}
                      onChange={(event) => {
                        addLaurels(event.target.files);
                        event.target.value = "";
                      }}
                    />
                    <MdEmojiEvents />
                    <span>Add laurel</span>
                  </label>
                )}
              </div>
              <span className="admin-card-subtitle">PNG or WebP with a transparent background, up to 4.</span>
            </div>
          </div>

          <div className="film-editor-video">
            <span className="admin-label">Video</span>
            {videoPreview || film?.src ? (
              <video
                className="film-editor-video-preview"
                src={videoPreview ?? film?.src ?? undefined}
                muted
                loop
                autoPlay
                playsInline
              />
            ) : null}
            <label
              className={`admin-dropzone${draggingOver === "video" ? " dragging" : ""}${saving ? " disabled" : ""}`}
              {...dropHandlers("video")}
            >
              <input
                type="file"
                accept={VIDEO_TYPES.join(",")}
                disabled={saving}
                onChange={(event) => {
                  selectVideo(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <MdMovie className="admin-dropzone-icon" />
              <span className="admin-dropzone-text">
                {video
                  ? `${video.name} · ${formatSize(video.size)}`
                  : film
                    ? "Drop a new clip here to replace the video"
                    : "Drop a clip here or click to choose"}
              </span>
              <span className="admin-card-subtitle">MP4, MOV or WebM, up to 4 GB</span>
            </label>
          </div>
        </div>

        {progress && (
          <div className="admin-progress">
            <span>{progress.label}</span>
            <progress value={progress.loaded} max={progress.total || 1} />
            <span>{progress.total ? Math.round((progress.loaded / progress.total) * 100) : 100}%</span>
          </div>
        )}

        {error && <p className="admin-status error">{error}</p>}

        <div className="film-editor-actions">
          <button type="button" className="admin-button-secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="admin-button" disabled={saving}>
            {saving ? "Saving…" : film ? "Save film" : "Add film"}
          </button>
        </div>
      </form>
    </div>
  );
}
