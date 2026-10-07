import "./film-manager.css";

import { useEffect, useState } from "react";
import { DndContext, DragOverlay, closestCenter, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { MdAdd, MdDeleteOutline, MdEdit, MdErrorOutline, MdHourglassTop, MdLink } from "react-icons/md";
import { useAuth } from "../../auth/AuthContext";
import londonLaurel from "../../assets/images/london_laurel.png";
import { SortableItem, SortableList, useDragSensors } from "../Sortable/Sortable";
import FilmEditor from "./FilmEditor";
import FilmPreview from "./FilmPreview";
import type { Project } from "../../types/Projects";

const API_URL = import.meta.env.VITE_API_URL;
const POLL_INTERVAL_MS = 5000;

export interface LibraryFilm {
  id: string;
  title: string;
  subtitle: string;
  link: string;
  laurels: boolean;
  laurelImages: { key: string; src: string }[];
  src: string | null;
  status: "processing" | "ready" | "failed";
  statusMessage?: string | null;
}

type View = "arrange" | "preview";

type Message = { kind: "success" | "error"; text: string };

const sameOrder = (a: LibraryFilm[], b: LibraryFilm[]) =>
  a.length === b.length && a.every((film, index) => film.id === b[index].id);

const errorText = (err: unknown) => (err instanceof Error ? err.message : "unknown error");

export default function FilmManager() {
  const { idToken } = useAuth();
  const sensors = useDragSensors();
  const [library, setLibrary] = useState<LibraryFilm[]>();
  const [draft, setDraft] = useState<LibraryFilm[]>([]);
  const [loadError, setLoadError] = useState<string>();
  const [view, setView] = useState<View>("arrange");
  const [editing, setEditing] = useState<LibraryFilm | "new">();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message>();
  const [confirmingDelete, setConfirmingDelete] = useState<string>();
  const [deleting, setDeleting] = useState<string>();
  const [draggingId, setDraggingId] = useState<string>();

  const request = async (method: string, body?: object) => {
    const response = await fetch(`${API_URL}/film_library`, {
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

  const load = async (keepDraftOrder = false) => {
    try {
      const data: LibraryFilm[] = await request("GET");
      setLibrary(data);
      setLoadError(undefined);
      setDraft((current) => {
        if (!keepDraftOrder) return data;

        const byId = new Map(data.map((film) => [film.id, film]));
        const kept = current.filter((film) => byId.has(film.id)).map((film) => byId.get(film.id)!);
        return [...kept, ...data.filter((film) => !current.some((c) => c.id === film.id))];
      });
    } catch (err) {
      setLoadError(errorText(err));
    }
  };

  const signedIn = Boolean(idToken);
  const processing = library?.some((film) => film.status === "processing") ?? false;

  useEffect(() => {
    if (signedIn) load();
  }, [signedIn]);

  useEffect(() => {
    if (!processing) return;

    const timer = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [processing, idToken]);

  const dirty = library !== undefined && !sameOrder(draft, library);

  const onDragStart = ({ active }: DragStartEvent) => setDraggingId(String(active.id));

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggingId(undefined);

    if (!over || active.id === over.id) return;

    setDraft((current) =>
      arrayMove(
        current,
        current.findIndex((film) => film.id === active.id),
        current.findIndex((film) => film.id === over.id)
      )
    );
  };

  const save = async () => {
    setSaving(true);
    setMessage(undefined);

    try {
      await request("PUT", { ids: draft.map((film) => film.id) });
      await load();
      setMessage({ kind: "success", text: "Order saved. The Film page now uses the new order." });
    } catch (err) {
      setMessage({ kind: "error", text: `Couldn't save the order: ${errorText(err)}` });
    } finally {
      setSaving(false);
    }
  };

  const deleteFilm = async (id: string) => {
    setDeleting(id);
    setMessage(undefined);

    try {
      await request("DELETE", { id });
      await load();
      setMessage({ kind: "success", text: "Film deleted." });
    } catch (err) {
      setMessage({ kind: "error", text: `Couldn't delete the film: ${errorText(err)}` });
    } finally {
      setDeleting(undefined);
      setConfirmingDelete(undefined);
    }
  };

  const onSaved = async (film: LibraryFilm) => {
    setEditing(undefined);
    await load(dirty);
    setMessage({
      kind: "success",
      text:
        film.status === "processing"
          ? `“${film.title}” saved. Its video is being optimized and will appear on the Film page when it's ready.`
          : `“${film.title}” saved.`
    });
  };

  const laurelSources = (film: LibraryFilm) => [
    ...(film.laurels ? [londonLaurel] : []),
    ...film.laurelImages.map((laurel) => laurel.src)
  ];

  const previewFilms: Project[] = draft
    .filter((film) => film.src)
    .map((film, index) => ({
      id: index + 1,
      title: film.title,
      subtitle: film.subtitle,
      src: film.src!,
      link: film.link || undefined,
      laurels: film.laurels,
      laurelImages: film.laurelImages.map((laurel) => laurel.src)
    }));

  const hiddenFromPreview = draft.filter((film) => !film.src);
  const draggedFilm = draft.find((film) => film.id === draggingId);

  if (!library) {
    return (
      <section className="admin-card film-manager-loading">
        {loadError ? (
          <>
            <p className="admin-status error">Couldn't load films: {loadError}</p>
            <button className="admin-button-secondary" onClick={() => load()}>
              Retry
            </button>
          </>
        ) : (
          <p className="admin-card-subtitle">Loading films…</p>
        )}
      </section>
    );
  }

  return (
    <div className={`film-manager${dirty ? " admin-has-savebar" : ""}`}>
      <div className="film-manager-toolbar">
        <div className="admin-segmented">
          {(["arrange", "preview"] as View[]).map((option) => (
            <button
              key={option}
              className={`admin-segmented-button${option === view ? " active" : ""}`}
              onClick={() => setView(option)}
            >
              {option === "arrange" ? "Arrange" : "Preview"}
            </button>
          ))}
        </div>
        {!editing && (
          <button className="admin-button film-manager-add" onClick={() => setEditing("new")}>
            <MdAdd /> Add film
          </button>
        )}
      </div>

      {editing && (
        <FilmEditor
          key={editing === "new" ? "new" : editing.id}
          film={editing === "new" ? undefined : editing}
          onCancel={() => setEditing(undefined)}
          onSaved={onSaved}
        />
      )}

      {message && <p className={`admin-status ${message.kind}`}>{message.text}</p>}

      {view === "arrange" ? (
        <section className="admin-card">
          <p className="admin-card-title">Films</p>
          <p className="admin-card-subtitle">
            Drag films to set the order they appear on the Film page, two per row. Switch to Preview to see the page.
          </p>

          {draft.length === 0 ? (
            <p className="admin-card-subtitle film-manager-empty">No films yet. Add one to get started.</p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragCancel={() => setDraggingId(undefined)}
            >
              <div className="film-manager-grid">
                <SortableList ids={draft.map((film) => film.id)}>
                  {draft.map((film, index) => (
                    <SortableItem
                      key={film.id}
                      id={film.id}
                      type="film"
                      disabled={saving}
                      className="film-manager-card"
                    >
                      {(dragHandleProps) => (
                        <>
                          <div
                            className="film-manager-media"
                            {...dragHandleProps}
                            aria-label={`${film.title}, position ${index + 1}. Press space to move`}
                          >
                            {film.src ? (
                              <video
                                src={`${film.src}#t=0.1`}
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                onMouseEnter={(event) => event.currentTarget.play().catch(() => {})}
                                onMouseLeave={(event) => event.currentTarget.pause()}
                              />
                            ) : (
                              <div className="film-manager-placeholder">
                                <MdHourglassTop />
                              </div>
                            )}
                            <span className="film-manager-position">{index + 1}</span>
                            {laurelSources(film).length > 0 && (
                              <div className="film-manager-laurels">
                                {laurelSources(film).map((src, laurelIndex) => (
                                  <img key={laurelIndex} src={src} alt="" />
                                ))}
                              </div>
                            )}
                            {film.status === "processing" && (
                              <span className="film-manager-badge processing">
                                <MdHourglassTop /> {film.src ? "Optimizing new video…" : "Optimizing…"}
                              </span>
                            )}
                            {film.status === "failed" && (
                              <span className="film-manager-badge failed" title={film.statusMessage ?? undefined}>
                                <MdErrorOutline /> Video failed
                              </span>
                            )}
                          </div>
                          <div className="film-manager-info">
                            <div className="film-manager-text">
                              <p className="film-manager-title">{film.title}</p>
                              <p className="admin-card-subtitle">
                                {film.subtitle}
                                {film.link && (
                                  <a href={film.link} target="_blank" rel="noreferrer" className="film-manager-link">
                                    <MdLink /> link
                                  </a>
                                )}
                              </p>
                              {film.status === "failed" && film.statusMessage && (
                                <p className="admin-status error film-manager-error">{film.statusMessage}</p>
                              )}
                            </div>
                            <div className="film-manager-actions">
                              <button
                                className="admin-icon-button"
                                aria-label={`Edit ${film.title}`}
                                onClick={() => setEditing(film)}
                              >
                                <MdEdit />
                              </button>
                              <button
                                className="admin-icon-button"
                                aria-label={`Delete ${film.title}`}
                                disabled={dirty || saving}
                                title={dirty ? "Save or discard order changes first" : "Delete film"}
                                onClick={() => setConfirmingDelete(film.id)}
                              >
                                <MdDeleteOutline />
                              </button>
                            </div>
                          </div>
                          {confirmingDelete === film.id && (
                            <div className="admin-confirm">
                              <span>Delete “{film.title}”?</span>
                              <div>
                                <button
                                  className="admin-confirm-yes"
                                  disabled={deleting === film.id}
                                  onClick={() => deleteFilm(film.id)}
                                >
                                  {deleting === film.id ? "…" : "Delete"}
                                </button>
                                <button
                                  className="admin-confirm-no"
                                  disabled={deleting === film.id}
                                  onClick={() => setConfirmingDelete(undefined)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </SortableItem>
                  ))}
                </SortableList>
              </div>
              <DragOverlay>
                {draggedFilm && <div className="film-manager-overlay">{draggedFilm.title}</div>}
              </DragOverlay>
            </DndContext>
          )}
        </section>
      ) : (
        <section className="admin-card film-manager-preview-card">
          <p className="admin-card-title">Film page preview</p>
          <p className="admin-card-subtitle">
            {dirty ? "Showing your unsaved order. " : ""}Hover a clip to see its title and laurels.
            {hiddenFromPreview.length > 0 &&
              ` Not shown until their video is ready: ${hiddenFromPreview.map((film) => film.title).join(", ")}.`}
          </p>
          <FilmPreview films={previewFilms} />
        </section>
      )}

      {dirty && (
        <div className="admin-savebar">
          <span>Unsaved order changes</span>
          <div className="admin-savebar-actions">
            <button className="admin-button-secondary" onClick={() => setDraft(library)} disabled={saving}>
              Discard
            </button>
            <button className="admin-button" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save order"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
