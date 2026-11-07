import "./reel-manager.css";

import { useEffect, useState, type FormEvent } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { MdAdd, MdDeleteOutline, MdDragIndicator } from "react-icons/md";
import { useAuth } from "../../auth/AuthContext";
import { SortableItem, SortableList, useDragSensors } from "../Sortable/Sortable";
import type { Reel } from "../../types/Projects";

const API_URL = import.meta.env.VITE_API_URL;

const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"];
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

type Message = { kind: "success" | "error"; text: string };

// Mirrors youtube_video_id in manage_reels.py so bad links are caught before saving
function youtubeVideoId(link: string) {
  let url: URL;

  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(url.protocol) || !YOUTUBE_HOSTS.includes(url.hostname)) return null;

  let candidate = "";

  if (url.hostname === "youtu.be") {
    candidate = url.pathname.replace(/^\/|\/$/g, "");
  } else if (url.pathname === "/watch") {
    candidate = url.searchParams.get("v") ?? "";
  } else {
    candidate = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)\/?$/)?.[1] ?? "";
  }

  return VIDEO_ID_PATTERN.test(candidate) ? candidate : null;
}

const sameOrder = (a: Reel[], b: Reel[]) =>
  a.length === b.length && a.every((reel, index) => reel.videoId === b[index].videoId);

const errorText = (err: unknown) => (err instanceof Error ? err.message : "unknown error");

export default function ReelManager() {
  const { idToken } = useAuth();
  const sensors = useDragSensors();
  const [saved, setSaved] = useState<Reel[]>();
  const [draft, setDraft] = useState<Reel[]>([]);
  const [loadError, setLoadError] = useState<string>();
  const [newLink, setNewLink] = useState("");
  const [linkError, setLinkError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message>();

  const request = async (method: string, body?: object) => {
    const response = await fetch(`${API_URL}/reels`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: idToken ?? "" },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const { error } = await response.json().catch(() => ({ error: undefined }));
      throw new Error(error ?? `request failed (${response.status})`);
    }

    return response.json();
  };

  const load = async () => {
    try {
      const data: Reel[] = await request("GET");
      setSaved(data);
      setDraft(data);
      setLoadError(undefined);
    } catch (err) {
      setLoadError(errorText(err));
    }
  };

  useEffect(() => {
    if (idToken) load();
  }, [Boolean(idToken)]);

  const dirty = saved !== undefined && !sameOrder(draft, saved);

  const addReel = (event: FormEvent) => {
    event.preventDefault();

    const videoId = youtubeVideoId(newLink);

    if (!videoId) {
      setLinkError("That isn't a YouTube video link.");
      return;
    }

    if (draft.some((reel) => reel.videoId === videoId)) {
      setLinkError("That reel is already in the list.");
      return;
    }

    setDraft((current) => [...current, { videoId, url: `https://www.youtube.com/watch?v=${videoId}` }]);
    setNewLink("");
    setLinkError(undefined);
    setMessage(undefined);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    setDraft((current) =>
      arrayMove(
        current,
        current.findIndex((reel) => reel.videoId === active.id),
        current.findIndex((reel) => reel.videoId === over.id)
      )
    );
  };

  const save = async () => {
    setSaving(true);
    setMessage(undefined);

    try {
      const data: Reel[] = await request("PUT", { links: draft.map((reel) => reel.url) });
      setSaved(data);
      setDraft(data);
      setMessage({ kind: "success", text: "Saved. The Reel page now shows these reels in this order." });
    } catch (err) {
      setMessage({ kind: "error", text: `Couldn't save the reels: ${errorText(err)}` });
    } finally {
      setSaving(false);
    }
  };

  if (!saved) {
    return (
      <section className="admin-card reel-manager-loading">
        {loadError ? (
          <>
            <p className="admin-status error">Couldn't load reels: {loadError}</p>
            <button className="admin-button-secondary" onClick={load}>
              Retry
            </button>
          </>
        ) : (
          <p className="admin-card-subtitle">Loading reels…</p>
        )}
      </section>
    );
  }

  return (
    <div className={`reel-manager${dirty ? " admin-has-savebar" : ""}`}>
      {message && <p className={`admin-status ${message.kind}`}>{message.text}</p>}

      <section className="admin-card">
        <p className="admin-card-title">Reels</p>
        <p className="admin-card-subtitle">Drag reels to set the order they appear on the Reel page.</p>

        {draft.length === 0 ? (
          <p className="admin-card-subtitle reel-manager-empty">No reels yet. Add a YouTube link below.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <div className="reel-manager-list">
              <SortableList ids={draft.map((reel) => reel.videoId)}>
                {draft.map((reel, index) => (
                  <SortableItem
                    key={reel.videoId}
                    id={reel.videoId}
                    type="reel"
                    disabled={saving}
                    className="reel-manager-row"
                  >
                    {(dragHandleProps) => (
                      <>
                        <span
                          className="reel-manager-handle"
                          {...dragHandleProps}
                          aria-label={`Reel ${index + 1}. Press space to move`}
                        >
                          <MdDragIndicator />
                        </span>
                        <span className="reel-manager-position">{index + 1}</span>
                        <img
                          className="reel-manager-thumbnail"
                          src={`https://i.ytimg.com/vi/${reel.videoId}/mqdefault.jpg`}
                          alt=""
                        />
                        <a className="reel-manager-link" href={reel.url} target="_blank" rel="noreferrer">
                          {reel.url}
                        </a>
                        <button
                          className="admin-icon-button"
                          aria-label={`Remove reel ${index + 1}`}
                          disabled={saving}
                          onClick={() => setDraft((current) => current.filter((r) => r.videoId !== reel.videoId))}
                        >
                          <MdDeleteOutline />
                        </button>
                      </>
                    )}
                  </SortableItem>
                ))}
              </SortableList>
            </div>
          </DndContext>
        )}

        <form className="reel-manager-add" onSubmit={addReel}>
          <input
            className="admin-input"
            type="url"
            value={newLink}
            placeholder="https://www.youtube.com/watch?v=…"
            aria-label="YouTube link"
            onChange={(e) => {
              setNewLink(e.target.value);
              setLinkError(undefined);
            }}
          />
          <button className="admin-button reel-manager-add-button" type="submit" disabled={!newLink.trim()}>
            <MdAdd /> Add reel
          </button>
        </form>
        {linkError && <p className="admin-status error">{linkError}</p>}
      </section>

      {dirty && (
        <div className="admin-savebar">
          <span>Unsaved reel changes</span>
          <div className="admin-savebar-actions">
            <button className="admin-button-secondary" onClick={() => setDraft(saved)} disabled={saving}>
              Discard
            </button>
            <button className="admin-button" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save reels"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
