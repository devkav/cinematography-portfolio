import "./photo-manager.css";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { MdAdd, MdCheck, MdClose, MdDeleteOutline, MdDragIndicator, MdFolderOpen } from "react-icons/md";
import { useAuth } from "../../auth/AuthContext";
import FileUpload from "../FileUpload/FileUpload";
import { SortableItem, SortableList, useDragSensors } from "../Sortable/Sortable";

const API_URL = import.meta.env.VITE_API_URL;
const NEW_ID = "__new__";

interface LibraryPhoto {
  id: string;
  src: string;
}

interface LibraryFolder {
  id: string;
  title: string;
  photos: LibraryPhoto[];
}

interface LibraryCollection {
  id: string;
  title: string;
  folders: LibraryFolder[];
}

interface LibraryChange {
  level: "collections" | "folders" | "photos";
  parent?: string;
  ids: string[];
}

type ItemType = "collection" | "folder" | "photo";

type Message = { kind: "success" | "error" | "info"; text: string };

const DND_PREFIX: Record<ItemType, string> = { collection: "c:", folder: "f:", photo: "p:" };
const MOVE_TARGET: Partial<Record<ItemType, ItemType>> = { folder: "collection", photo: "folder" };

const dndId = (type: ItemType, id: string) => `${DND_PREFIX[type]}${id}`;
const rawId = (id: string | number) => String(id).slice(2);

const ids = (items: { id: string }[]) => items.map((item) => item.id);

const sameOrder = (a: string[], b: string[]) => a.length === b.length && a.every((id, index) => id === b[index]);

const moveWithin = <T extends { id: string }>(items: T[], fromId: string, toId: string) =>
  arrayMove(
    items,
    items.findIndex((item) => item.id === fromId),
    items.findIndex((item) => item.id === toId)
  );

const errorText = (err: unknown) => (err instanceof Error ? err.message : "unknown error");

const collisionDetection: CollisionDetection = (args) => {
  const type = args.active.data.current?.type as ItemType;
  const target = MOVE_TARGET[type];

  if (target) {
    const hits = pointerWithin({
      ...args,
      droppableContainers: args.droppableContainers.filter((container) => container.data.current?.type === target)
    });

    if (hits.length) return hits;
  }

  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter((container) => container.data.current?.type === type)
  });
};

export default function PhotoManager() {
  const { idToken } = useAuth();
  const [library, setLibrary] = useState<LibraryCollection[]>();
  const [draft, setDraft] = useState<LibraryCollection[]>([]);
  const [loadError, setLoadError] = useState<string>();
  const [collectionId, setCollectionId] = useState<string>();
  const [folderId, setFolderId] = useState<string>();
  const [newCollection, setNewCollection] = useState<string>();
  const [newFolder, setNewFolder] = useState<string>();
  const [naming, setNaming] = useState<"collection" | "folder">();
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message>();
  const [confirmingDelete, setConfirmingDelete] = useState<string>();
  const [deleting, setDeleting] = useState<string>();
  const [dragging, setDragging] = useState<{ type: ItemType; id: string }>();

  const sensors = useDragSensors();

  const request = async (method: string, body?: object) => {
    const response = await fetch(`${API_URL}/photo_library`, {
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

  const load = async (keepDraft = false) => {
    try {
      const data: LibraryCollection[] = await request("GET");
      setLibrary(data);
      setLoadError(undefined);

      if (!keepDraft) setDraft(data);

      return data;
    } catch (err) {
      setLoadError(errorText(err));
    }
  };

  const signedIn = Boolean(idToken);

  useEffect(() => {
    if (signedIn) load();
  }, [signedIn]);

  const changes: LibraryChange[] = [];

  if (library) {
    const originalFolders = new Map(library.flatMap((c) => c.folders).map((f) => [f.id, f]));

    if (!sameOrder(ids(draft), ids(library))) {
      changes.push({ level: "collections", ids: ids(draft) });
    }

    draft.forEach((collection) => {
      const original = library.find((c) => c.id === collection.id);

      if (original && !sameOrder(ids(collection.folders), ids(original.folders))) {
        changes.push({ level: "folders", parent: collection.id, ids: ids(collection.folders) });
      }

      collection.folders.forEach((folder) => {
        const originalFolder = originalFolders.get(folder.id);

        if (originalFolder && !sameOrder(ids(folder.photos), ids(originalFolder.photos))) {
          changes.push({ level: "photos", parent: folder.id, ids: ids(folder.photos) });
        }
      });
    });
  }

  const dirty = changes.length > 0;

  const selectedCollection =
    collectionId === NEW_ID && newCollection
      ? { id: NEW_ID, title: newCollection, folders: [] }
      : draft.find((c) => c.id === collectionId);

  const selectedFolder =
    folderId === NEW_ID && newFolder
      ? { id: NEW_ID, title: newFolder, photos: [] }
      : selectedCollection?.folders.find((f) => f.id === folderId);

  const selectCollection = (id: string) => {
    setCollectionId(id);
    setFolderId(undefined);
    setNewFolder(undefined);
    setNaming(undefined);

    if (id !== NEW_ID) setNewCollection(undefined);
  };

  const selectFolder = (id: string) => {
    setFolderId(id);
    setNaming(undefined);

    if (id !== NEW_ID) setNewFolder(undefined);
  };

  const startNaming = (target: "collection" | "folder") => {
    setNaming(target);
    setNameInput("");
  };

  const confirmName = () => {
    const name = nameInput.trim();

    if (!name) return;

    if (naming === "collection") {
      setNewCollection(name);
      selectCollection(NEW_ID);
      setNaming("folder");
      setNameInput("");
    } else {
      setNewFolder(name);
      selectFolder(NEW_ID);
    }
  };

  const updateSelectedCollection = (update: (collection: LibraryCollection) => LibraryCollection) =>
    setDraft((current) => current.map((c) => (c.id === collectionId ? update(c) : c)));

  const movePhoto = (photoId: string, targetFolderId: string) => {
    const source = selectedCollection?.folders.find((f) => f.id === folderId);
    const photo = source?.photos.find((p) => p.id === photoId);
    const target = selectedCollection?.folders.find((f) => f.id === targetFolderId);

    if (!photo || !target || targetFolderId === folderId) return;

    updateSelectedCollection((c) => ({
      ...c,
      folders: c.folders.map((f) => {
        if (f.id === folderId) return { ...f, photos: f.photos.filter((p) => p.id !== photoId) };
        if (f.id === targetFolderId) return { ...f, photos: [...f.photos, photo] };
        return f;
      })
    }));

    setMessage({ kind: "info", text: `Moved a photo to “${target.title}”. Save to apply.` });
  };

  const moveFolder = (movedFolderId: string, targetCollectionId: string) => {
    const folder = selectedCollection?.folders.find((f) => f.id === movedFolderId);
    const target = draft.find((c) => c.id === targetCollectionId);

    if (!folder || !target || targetCollectionId === collectionId) return;

    setDraft((current) =>
      current.map((c) => {
        if (c.id === collectionId) return { ...c, folders: c.folders.filter((f) => f.id !== movedFolderId) };
        if (c.id === targetCollectionId) return { ...c, folders: [...c.folders, folder] };
        return c;
      })
    );

    if (folderId === movedFolderId) setFolderId(undefined);

    setMessage({ kind: "info", text: `Moved “${folder.title}” to “${target.title}”. Save to apply.` });
  };

  const onDragStart = ({ active }: DragStartEvent) =>
    setDragging({ type: active.data.current?.type as ItemType, id: rawId(active.id) });

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(undefined);

    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type as ItemType;
    const overType = over.data.current?.type as ItemType;
    const activeId = rawId(active.id);
    const overId = rawId(over.id);

    if (activeType === "collection" && overType === "collection") {
      setDraft((current) => moveWithin(current, activeId, overId));
    } else if (activeType === "folder" && overType === "folder") {
      updateSelectedCollection((c) => ({ ...c, folders: moveWithin(c.folders, activeId, overId) }));
    } else if (activeType === "photo" && overType === "photo") {
      updateSelectedCollection((c) => ({
        ...c,
        folders: c.folders.map((f) =>
          f.id === folderId ? { ...f, photos: moveWithin(f.photos, activeId, overId) } : f
        )
      }));
    } else if (activeType === "photo" && overType === "folder") {
      movePhoto(activeId, overId);
    } else if (activeType === "folder" && overType === "collection") {
      moveFolder(activeId, overId);
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage(undefined);

    try {
      await request("PUT", { changes });
      await load();
      setMessage({ kind: "success", text: "Changes saved. The Photo page now reflects them." });
    } catch (err) {
      await load(true);
      setMessage({ kind: "error", text: `Couldn't save changes: ${errorText(err)}` });
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setDraft(library ?? []);
    setMessage(undefined);

    if (folderId && !library?.some((c) => c.id === collectionId && c.folders.some((f) => f.id === folderId))) {
      setFolderId(undefined);
    }
  };

  const deletePhoto = async (id: string) => {
    setDeleting(id);
    setMessage(undefined);

    try {
      await request("DELETE", { id });
      await load();
      setMessage({ kind: "success", text: "Photo deleted." });
    } catch (err) {
      setMessage({ kind: "error", text: `Couldn't delete the photo: ${errorText(err)}` });
    } finally {
      setDeleting(undefined);
      setConfirmingDelete(undefined);
    }
  };

  const onUploadComplete = async (uploadedIds: string[]) => {
    const data = await load();

    if (!data) return;

    const collection =
      collectionId === NEW_ID ? data.find((c) => c.title === newCollection) : data.find((c) => c.id === collectionId);

    if (collectionId === NEW_ID && collection) {
      setCollectionId(collection.id);
      setNewCollection(undefined);
    }

    const folder =
      folderId === NEW_ID
        ? collection?.folders.find((f) => f.title === newFolder)
        : collection?.folders.find((f) => f.id === folderId);

    if (folderId === NEW_ID && folder) {
      setFolderId(folder.id);
      setNewFolder(undefined);
    }

    if (!folder) return;

    const uploaded = new Set(uploadedIds);
    const currentIds = ids(folder.photos);
    const orderedIds = [
      ...currentIds.filter((id) => !uploaded.has(id)),
      ...uploadedIds.filter((id) => currentIds.includes(id))
    ];

    if (sameOrder(orderedIds, currentIds)) return;

    try {
      await request("PUT", { changes: [{ level: "photos", parent: folder.id, ids: orderedIds }] });
      await load();
    } catch (err) {
      setMessage({ kind: "error", text: `Photos uploaded, but their order couldn't be saved: ${errorText(err)}` });
    }
  };

  const dragPreview = () => {
    if (!dragging) return null;

    if (dragging.type === "collection") {
      const collection = draft.find((c) => c.id === dragging.id);
      return <div className="photo-manager-chip photo-manager-overlay">{collection?.title}</div>;
    }

    if (dragging.type === "folder") {
      const folder = selectedCollection?.folders.find((f) => f.id === dragging.id);
      return <div className="photo-manager-chip photo-manager-overlay">{folder?.title}</div>;
    }

    const photo = selectedFolder?.photos.find((p) => p.id === dragging.id);
    return photo ? <img className="photo-manager-overlay photo-manager-overlay-photo" src={photo.src} alt="" /> : null;
  };

  const nameForm = (
    <form
      className="photo-manager-name-form"
      onSubmit={(event) => {
        event.preventDefault();
        confirmName();
      }}
    >
      <input
        className="admin-input"
        autoFocus
        placeholder={naming === "collection" ? "Collection name" : "Folder name"}
        value={nameInput}
        onChange={(event) => setNameInput(event.target.value)}
      />
      <button className="admin-icon-button" type="submit" aria-label="Add" disabled={!nameInput.trim()}>
        <MdCheck />
      </button>
      <button className="admin-icon-button" type="button" aria-label="Cancel" onClick={() => setNaming(undefined)}>
        <MdClose />
      </button>
    </form>
  );

  if (!library) {
    return (
      <section className="admin-card photo-manager-loading">
        {loadError ? (
          <>
            <p className="admin-status error">Couldn't load photos: {loadError}</p>
            <button className="admin-button-secondary" onClick={() => load()}>
              Retry
            </button>
          </>
        ) : (
          <p className="admin-card-subtitle">Loading photos…</p>
        )}
      </section>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(undefined)}
    >
      <div
        className={`photo-manager${dragging ? ` dragging-${dragging.type}` : ""}${dirty ? " admin-has-savebar" : ""}`}
      >
        <section className="admin-card">
          <p className="admin-card-title">Collections</p>
          <p className="admin-card-subtitle">
            Drag the handles to reorder collections. Drop a folder on a collection to move it there.
          </p>
          <div className="photo-manager-chips">
            <SortableList ids={draft.map((c) => dndId("collection", c.id))}>
              {draft.map((collection) => (
                <SortableItem
                  key={collection.id}
                  id={dndId("collection", collection.id)}
                  type="collection"
                  acceptsType="folder"
                  disabled={saving}
                  className={`photo-manager-chip${collection.id === collectionId ? " active" : ""}`}
                >
                  {(dragHandleProps) => (
                    <>
                      <span
                        className="photo-manager-handle"
                        {...dragHandleProps}
                        aria-label={`Reorder ${collection.title}`}
                      >
                        <MdDragIndicator />
                      </span>
                      <button className="photo-manager-chip-button" onClick={() => selectCollection(collection.id)}>
                        {collection.title}
                        <span className="photo-manager-count">{collection.folders.length}</span>
                      </button>
                    </>
                  )}
                </SortableItem>
              ))}
            </SortableList>
            {newCollection && (
              <div className={`photo-manager-chip pending${collectionId === NEW_ID ? " active" : ""}`}>
                <button className="photo-manager-chip-button" onClick={() => selectCollection(NEW_ID)}>
                  {newCollection}
                  <span className="photo-manager-count">new</span>
                </button>
              </div>
            )}
            {naming === "collection" ? (
              nameForm
            ) : (
              <button className="photo-manager-add" onClick={() => startNaming("collection")}>
                <MdAdd /> New collection
              </button>
            )}
          </div>
        </section>

        {selectedCollection && (
          <section className="admin-card">
            <p className="admin-card-title">Folders in {selectedCollection.title}</p>
            <p className="admin-card-subtitle">
              Drag the handles to reorder folders, or onto a collection above to move them. Drop a photo on a folder to
              move it there.
            </p>
            <div className="photo-manager-folders">
              <SortableList ids={selectedCollection.folders.map((f) => dndId("folder", f.id))}>
                {selectedCollection.folders.map((folder) => (
                  <SortableItem
                    key={folder.id}
                    id={dndId("folder", folder.id)}
                    type="folder"
                    acceptsType="photo"
                    disabled={saving}
                    className={`photo-manager-folder${folder.id === folderId ? " active" : ""}`}
                  >
                    {(dragHandleProps) => (
                      <>
                        <span
                          className="photo-manager-handle"
                          {...dragHandleProps}
                          aria-label={`Reorder ${folder.title}`}
                        >
                          <MdDragIndicator />
                        </span>
                        <button className="photo-manager-folder-button" onClick={() => selectFolder(folder.id)}>
                          {folder.photos[0] ? (
                            <img className="photo-manager-cover" src={folder.photos[0].src} alt="" loading="lazy" />
                          ) : (
                            <span className="photo-manager-cover empty">
                              <MdFolderOpen />
                            </span>
                          )}
                          <span className="photo-manager-folder-text">
                            <span className="photo-manager-folder-title">{folder.title}</span>
                            <span className="admin-card-subtitle">
                              {folder.photos.length} photo{folder.photos.length === 1 ? "" : "s"}
                            </span>
                          </span>
                        </button>
                      </>
                    )}
                  </SortableItem>
                ))}
              </SortableList>
              {newFolder && (
                <div className={`photo-manager-folder pending${folderId === NEW_ID ? " active" : ""}`}>
                  <button className="photo-manager-folder-button" onClick={() => selectFolder(NEW_ID)}>
                    <span className="photo-manager-cover empty">
                      <MdFolderOpen />
                    </span>
                    <span className="photo-manager-folder-text">
                      <span className="photo-manager-folder-title">{newFolder}</span>
                      <span className="admin-card-subtitle">New · upload photos to create it</span>
                    </span>
                  </button>
                </div>
              )}
              {naming === "folder" ? (
                nameForm
              ) : (
                <button className="photo-manager-add" onClick={() => startNaming("folder")}>
                  <MdAdd /> New folder
                </button>
              )}
            </div>
          </section>
        )}

        {selectedCollection && selectedFolder && (
          <section className="admin-card">
            <p className="admin-card-title">{selectedFolder.title}</p>
            <p className="admin-card-subtitle">
              Shown on the Photo page in this order. Drag photos to rearrange them, or onto a folder above to move them.
            </p>

            {selectedFolder.photos.length === 0 ? (
              <p className="admin-card-subtitle photo-manager-empty">No photos yet. Upload some below.</p>
            ) : (
              <div className="photo-manager-grid">
                <SortableList ids={selectedFolder.photos.map((p) => dndId("photo", p.id))}>
                  {selectedFolder.photos.map((photo, index) => (
                    <SortableItem
                      key={photo.id}
                      id={dndId("photo", photo.id)}
                      type="photo"
                      disabled={saving}
                      className="photo-manager-tile"
                    >
                      {(dragHandleProps) => (
                        <>
                          <div
                            className="photo-manager-tile-drag"
                            {...dragHandleProps}
                            aria-label={`Photo ${index + 1}, press space to move`}
                          >
                            <img src={photo.src} alt="" loading="lazy" draggable={false} />
                            <span className="photo-manager-position">{index + 1}</span>
                          </div>
                          {confirmingDelete === photo.id ? (
                            <div className="admin-confirm">
                              <span>Delete?</span>
                              <div>
                                <button
                                  className="admin-confirm-yes"
                                  disabled={deleting === photo.id}
                                  onClick={() => deletePhoto(photo.id)}
                                >
                                  {deleting === photo.id ? "…" : "Yes"}
                                </button>
                                <button
                                  className="admin-confirm-no"
                                  disabled={deleting === photo.id}
                                  onClick={() => setConfirmingDelete(undefined)}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              className="photo-manager-delete"
                              aria-label={`Delete photo ${index + 1}`}
                              title={dirty ? "Save or discard changes first" : "Delete photo"}
                              disabled={dirty || saving}
                              onClick={() => setConfirmingDelete(photo.id)}
                            >
                              <MdDeleteOutline />
                            </button>
                          )}
                        </>
                      )}
                    </SortableItem>
                  ))}
                </SortableList>
              </div>
            )}

            <div className="photo-manager-upload">
              <p className="admin-label">Add photos to the end of this folder</p>
              {dirty && <p className="admin-status">Save or discard changes before uploading.</p>}
              <FileUpload
                collection={selectedCollection.title}
                folder={selectedFolder.title}
                disabled={dirty || saving}
                onComplete={onUploadComplete}
              />
            </div>
          </section>
        )}

        {message && <p className={`admin-status ${message.kind}`}>{message.text}</p>}

        {dirty && (
          <div className="admin-savebar">
            <span>Unsaved changes</span>
            <div className="admin-savebar-actions">
              <button className="admin-button-secondary" onClick={discard} disabled={saving}>
                Discard
              </button>
              <button className="admin-button" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        )}
      </div>
      <DragOverlay>{dragPreview()}</DragOverlay>
    </DndContext>
  );
}
