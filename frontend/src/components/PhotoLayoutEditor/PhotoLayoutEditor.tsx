import "./photo-layout-editor.css";

import { useEffect, useRef, useState, type CSSProperties, type SyntheticEvent } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { MdAdd, MdClose, MdDeleteOutline, MdDragIndicator, MdRemove } from "react-icons/md";
import { useAuth } from "../../auth/AuthContext";
import type { PhotoLabelSide } from "src/types/Projects";
import type { LibraryCollection } from "../PhotoManager/PhotoManager";
import { SortableItem, useDragSensors } from "../Sortable/Sortable";

const API_URL = import.meta.env.VITE_API_URL;
const MIN_WIDTH = 10;
const MAX_GAP = 20;
const MAX_FLEX = 12;
const MAX_LABEL_LENGTH = 60;
const NEW_ROW_ID = "__new__";
const SIDEBAR_INSET = 24;

type Sizing = "flex" | "width" | "height";

const SIZINGS: { sizing: Sizing; label: string }[] = [
  { sizing: "flex", label: "Flex" },
  { sizing: "width", label: "Same width" },
  { sizing: "height", label: "Same height" }
];

const LABEL_SIDES: { side: PhotoLabelSide; label: string }[] = [
  { side: "left", label: "Left" },
  { side: "right", label: "Right" }
];

interface SavedRow {
  width: number;
  gap: number;
  space: number;
  sizing: Sizing;
  label: string;
  labelSide: PhotoLabelSide;
  cells: { photo: string; flex: number; ratio: number }[];
}

interface LayoutCell {
  id: string;
  photo: string;
  flex: number;
  ratio: number;
}

interface LayoutRow {
  id: string;
  width: number;
  gap: number;
  space: number;
  sizing: Sizing;
  label: string;
  labelSide: PhotoLabelSide;
  cells: LayoutCell[];
}

type DragType = "row" | "cell";

type Message = { kind: "success" | "error"; text: string };

const errorText = (err: unknown) => (err instanceof Error ? err.message : "unknown error");

const newId = () => crypto.randomUUID();

const withIds = (rows: SavedRow[]): LayoutRow[] =>
  rows.map((row) => ({ ...row, id: newId(), cells: row.cells.map((cell) => ({ ...cell, id: newId() })) }));

const withoutIds = (rows: SavedRow[]): SavedRow[] =>
  rows.map(({ width, gap, space, sizing, label, labelSide, cells }) => ({
    width,
    gap,
    space,
    sizing,
    label,
    labelSide,
    cells: cells.map(({ photo, flex, ratio }) => ({ photo, flex, ratio }))
  }));

const moveWithin = <T extends { id: string }>(items: T[], fromId: string, toId: string) =>
  arrayMove(
    items,
    items.findIndex((item) => item.id === fromId),
    items.findIndex((item) => item.id === toId)
  );

const rowOfCell = (rows: LayoutRow[], cellId: string) =>
  rows.find((row) => row.cells.some((cell) => cell.id === cellId));

const collisionDetection: CollisionDetection = (args) => {
  const ofType = (type: DragType) =>
    args.droppableContainers.filter((container) => container.data.current?.type === type);

  if (args.active.data.current?.type === "cell") {
    const cellHits = pointerWithin({ ...args, droppableContainers: ofType("cell") });
    if (cellHits.length) return cellHits;

    const rowHits = pointerWithin({ ...args, droppableContainers: ofType("row") });
    if (rowHits.length) return rowHits;

    return closestCenter({ ...args, droppableContainers: ofType("cell") });
  }

  return closestCenter({ ...args, droppableContainers: ofType("row") });
};

export default function PhotoLayoutEditor() {
  const { idToken } = useAuth();
  const [library, setLibrary] = useState<LibraryCollection[]>();
  const [saved, setSaved] = useState<SavedRow[]>([]);
  const [draft, setDraft] = useState<LayoutRow[]>([]);
  const [loadError, setLoadError] = useState<string>();
  const [selectedRowId, setSelectedRowId] = useState<string>();
  const [picking, setPicking] = useState<string>();
  const [pickerFolder, setPickerFolder] = useState<string>();
  const [selected, setSelected] = useState<string[]>([]);
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const [dragging, setDragging] = useState<{ type: DragType; id: string }>();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message>();
  const [sidebarTop, setSidebarTop] = useState(SIDEBAR_INSET);
  const sidebarSlot = useRef<HTMLDivElement>(null);
  const changedRow = useRef(false);

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

  const load = async () => {
    try {
      const { collections, layout }: { collections: LibraryCollection[]; layout: SavedRow[] } = await request("GET");
      setLibrary(collections);
      setSaved(layout);
      setDraft(withIds(layout));
      setSelectedRowId(undefined);
      setLoadError(undefined);
    } catch (err) {
      setLoadError(errorText(err));
    }
  };

  const signedIn = Boolean(idToken);

  useEffect(() => {
    if (signedIn) load();
  }, [signedIn]);

  useEffect(() => {
    const updateSidebarTop = () =>
      setSidebarTop(Math.max(SIDEBAR_INSET, sidebarSlot.current?.getBoundingClientRect().top ?? SIDEBAR_INSET));

    updateSidebarTop();
    window.addEventListener("scroll", updateSidebarTop, true);
    window.addEventListener("resize", updateSidebarTop);

    return () => {
      window.removeEventListener("scroll", updateSidebarTop, true);
      window.removeEventListener("resize", updateSidebarTop);
    };
  }, [library]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => (changedRow.current = false));
    return () => cancelAnimationFrame(frame);
  }, [draft]);

  const folders = (library ?? []).flatMap((collection) => collection.folders);
  const photosById = new Map(
    folders.flatMap((folder) => folder.photos.map((photo) => [photo.id, { ...photo, folder: folder.title }] as const))
  );
  const usedPhotos = new Set(draft.flatMap(({ cells }) => cells.map(({ photo }) => photo)));
  const dirty = JSON.stringify(withoutIds(draft)) !== JSON.stringify(withoutIds(saved));
  const selectedRowIndex = draft.findIndex(({ id }) => id === selectedRowId);
  const selectedRow = draft[selectedRowIndex];

  const updateRow = (rowId: string, change: Partial<LayoutRow>) =>
    setDraft((rows) => rows.map((row) => (row.id === rowId ? { ...row, ...change } : row)));

  const updateCells = (rowId: string, update: (cells: LayoutCell[]) => LayoutCell[]) =>
    setDraft((rows) =>
      rows
        .map((row) => (row.id === rowId ? { ...row, cells: update(row.cells) } : row))
        .filter((row) => row.cells.length > 0)
    );

  const openPicker = (rowId: string) => {
    setPicking(rowId);
    setSelected([]);
    setPickerFolder((current) => current ?? folders.find((folder) => folder.photos.length > 0)?.id);
  };

  const toggleSelected = (photo: string) =>
    setSelected((current) => (current.includes(photo) ? current.filter((id) => id !== photo) : [...current, photo]));

  const measure =
    (photo: string) =>
    ({ currentTarget: { naturalWidth, naturalHeight } }: SyntheticEvent<HTMLImageElement>) =>
      setRatios((current) =>
        current[photo] || !naturalHeight ? current : { ...current, [photo]: naturalWidth / naturalHeight }
      );

  const ratioOf = (cell: LayoutCell) => ratios[cell.photo] ?? cell.ratio;

  const flexOf = (row: LayoutRow, cell: LayoutCell) =>
    row.sizing === "height" ? ratioOf(cell) : row.sizing === "width" ? 1 : cell.flex;

  const addSelected = () => {
    const cells = selected.map((photo) => ({ id: newId(), photo, flex: 1, ratio: ratios[photo] ?? 1 }));

    if (picking === NEW_ROW_ID) {
      const id = newId();
      setDraft((rows) => [
        ...rows,
        { id, width: 100, gap: 2, space: 4, sizing: "flex", label: "", labelSide: "left", cells }
      ]);
      setSelectedRowId(id);
    } else if (picking) {
      updateCells(picking, (current) => [...current, ...cells]);
    }

    setPicking(undefined);
  };

  const onDragStart = ({ active }: DragStartEvent) =>
    setDragging({ type: active.data.current?.type as DragType, id: String(active.id) });

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.data.current?.type !== "cell" || changedRow.current) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const overRow = over.data.current?.type === "row";
    const from = rowOfCell(draft, activeId);
    const to = overRow ? draft.find((row) => row.id === overId) : rowOfCell(draft, overId);

    if (!from || !to || from.id === to.id) return;

    const cell = from.cells.find(({ id }) => id === activeId)!;
    const index = overRow ? to.cells.length : to.cells.findIndex(({ id }) => id === overId);

    changedRow.current = true;
    setDraft(
      draft.map((row) => {
        if (row.id === from.id) return { ...row, cells: row.cells.filter(({ id }) => id !== activeId) };
        if (row.id === to.id) return { ...row, cells: [...row.cells.slice(0, index), cell, ...row.cells.slice(index)] };
        return row;
      })
    );
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(undefined);

    const activeId = String(active.id);
    const overId = over ? String(over.id) : undefined;
    const activeType = active.data.current?.type as DragType;
    const overType = over?.data.current?.type as DragType | undefined;

    if (activeType === "cell") {
      setSelectedRowId(rowOfCell(draft, activeId)?.id);
    }

    setDraft((rows) => {
      let next = rows;

      if (overId && overId !== activeId && activeType === "row" && overType === "row") {
        next = moveWithin(rows, activeId, overId);
      } else if (overId && overId !== activeId && activeType === "cell" && overType === "cell") {
        next = rows.map((row) =>
          row.cells.some(({ id }) => id === overId) ? { ...row, cells: moveWithin(row.cells, activeId, overId) } : row
        );
      }

      return next.filter((row) => row.cells.length > 0);
    });
  };

  const onDragCancel = () => {
    setDragging(undefined);
    setDraft((rows) => rows.filter((row) => row.cells.length > 0));
  };

  const save = async () => {
    setSaving(true);
    setMessage(undefined);

    try {
      await request("PUT", {
        layout: withoutIds(draft).map((row, rowIndex) => ({
          ...row,
          cells: row.cells.map((cell, cellIndex) => ({ ...cell, ratio: ratioOf(draft[rowIndex].cells[cellIndex]) }))
        }))
      });
      await load();
      setMessage({ kind: "success", text: "Layout saved. The Photo page now reflects it." });
    } catch (err) {
      setMessage({ kind: "error", text: `Couldn't save the layout: ${errorText(err)}` });
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setDraft(withIds(saved));
    setSelectedRowId(undefined);
    setPicking(undefined);
    setMessage(undefined);
  };

  const dragPreview = () => {
    if (dragging?.type === "row") {
      return <div className="photo-layout-overlay-row">Row {draft.findIndex(({ id }) => id === dragging.id) + 1}</div>;
    }

    if (dragging?.type === "cell") {
      const cell = rowOfCell(draft, dragging.id)?.cells.find(({ id }) => id === dragging.id);
      return <img className="photo-layout-overlay-photo" src={cell && photosById.get(cell.photo)?.src} alt="" />;
    }

    return null;
  };

  if (!library) {
    return (
      <section className="admin-card photo-layout-loading">
        {loadError ? (
          <>
            <p className="admin-status error">Couldn't load the layout: {loadError}</p>
            <button className="admin-button-secondary" onClick={() => load()}>
              Retry
            </button>
          </>
        ) : (
          <p className="admin-card-subtitle">Loading layout…</p>
        )}
      </section>
    );
  }

  const pickerPhotos = folders.find((folder) => folder.id === pickerFolder)?.photos ?? [];
  const pickingRowNumber = draft.findIndex(({ id }) => id === picking) + 1;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className={`photo-layout${dirty ? " admin-has-savebar" : ""}`}>
        <div
          className="photo-layout-canvas"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedRowId(undefined);
          }}
        >
          <SortableContext items={draft.map(({ id }) => id)} strategy={verticalListSortingStrategy}>
            {draft.map((row, rowIndex) => (
              <SortableItem
                key={row.id}
                id={row.id}
                type="row"
                disabled={saving}
                className={`photo-layout-canvas-row${row.id === selectedRowId ? " selected" : ""}${row.label.trim() ? " labeled" : ""}`}
                style={
                  {
                    "--width": `${row.width}%`,
                    "--gap": `${row.gap}cqw`,
                    "--space": `${row.space}cqw`
                  } as CSSProperties
                }
              >
                {(rowHandleProps) => (
                  <div className="photo-layout-canvas-cells" onClick={() => setSelectedRowId(row.id)}>
                    <span
                      className="photo-layout-row-handle"
                      {...rowHandleProps}
                      aria-label={`Reorder row ${rowIndex + 1}`}
                    >
                      <MdDragIndicator />
                      {rowIndex + 1}
                    </span>
                    <SortableContext items={row.cells.map(({ id }) => id)} strategy={horizontalListSortingStrategy}>
                      {row.cells.map((cell, cellIndex) => (
                        <SortableItem
                          key={cell.id}
                          id={cell.id}
                          type="cell"
                          disabled={saving}
                          className="photo-layout-canvas-cell"
                          style={{ "--flex": flexOf(row, cell) } as CSSProperties}
                        >
                          {(cellHandleProps) => (
                            <div
                              className="photo-layout-canvas-photo"
                              {...cellHandleProps}
                              aria-label={`Row ${rowIndex + 1}, photo ${cellIndex + 1}, press space to move`}
                            >
                              <img
                                src={photosById.get(cell.photo)?.src}
                                alt=""
                                draggable={false}
                                onLoad={measure(cell.photo)}
                              />
                              {row.label.trim() &&
                                cellIndex === (row.labelSide === "right" ? row.cells.length - 1 : 0) && (
                                  <p className={`photo-layout-canvas-label ${row.labelSide}`}>{row.label}</p>
                                )}
                            </div>
                          )}
                        </SortableItem>
                      ))}
                    </SortableContext>
                  </div>
                )}
              </SortableItem>
            ))}
          </SortableContext>

          <button className="photo-layout-canvas-add" disabled={saving} onClick={() => openPicker(NEW_ROW_ID)}>
            <MdAdd /> Add row
          </button>
        </div>

        <div className="photo-layout-sidebar-slot" ref={sidebarSlot}>
          <aside
            className="admin-card photo-layout-sidebar"
            style={{ "--sidebar-top": `${sidebarTop}px`, "--sidebar-inset": `${SIDEBAR_INSET}px` } as CSSProperties}
          >
            {selectedRow ? (
              <>
                <div className="photo-layout-header">
                  <p className="admin-card-title">Row {selectedRowIndex + 1}</p>
                  <div className="photo-layout-actions">
                    <button
                      className="admin-icon-button"
                      aria-label={`Remove row ${selectedRowIndex + 1}`}
                      disabled={saving}
                      onClick={() => {
                        setDraft((rows) => rows.filter(({ id }) => id !== selectedRow.id));
                        setSelectedRowId(undefined);
                      }}
                    >
                      <MdDeleteOutline />
                    </button>
                    <button
                      className="admin-icon-button"
                      aria-label="Close row settings"
                      onClick={() => setSelectedRowId(undefined)}
                    >
                      <MdClose />
                    </button>
                  </div>
                </div>

                <div className="photo-layout-settings">
                  <div className="photo-layout-option">
                    <span className="admin-label">Sizing</span>
                    <div className="admin-segmented">
                      {SIZINGS.map(({ sizing, label }) => (
                        <button
                          key={sizing}
                          className={`admin-segmented-button${selectedRow.sizing === sizing ? " active" : ""}`}
                          aria-pressed={selectedRow.sizing === sizing}
                          disabled={saving}
                          onClick={() => updateRow(selectedRow.id, { sizing })}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(
                    [
                      { key: "width", label: "Width", min: MIN_WIDTH, max: 100, step: 5 },
                      { key: "space", label: "Space above", min: 0, max: MAX_GAP, step: 1 },
                      { key: "gap", label: "Photo spacing", min: 0, max: MAX_GAP, step: 1 }
                    ] as const
                  ).map(({ key, label, min, max, step }) => (
                    <label className="photo-layout-slider" key={key}>
                      <span className="admin-label">{label}</span>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={selectedRow[key]}
                        disabled={saving}
                        onChange={(event) => updateRow(selectedRow.id, { [key]: Number(event.target.value) })}
                      />
                      <span className="photo-layout-value">{selectedRow[key]}%</span>
                    </label>
                  ))}
                  <div className="photo-layout-option">
                    <label className="admin-label" htmlFor="photo-layout-label-input">
                      Label
                    </label>
                    <input
                      id="photo-layout-label-input"
                      className="admin-input"
                      value={selectedRow.label}
                      maxLength={MAX_LABEL_LENGTH}
                      placeholder="No label"
                      disabled={saving}
                      onChange={(event) => updateRow(selectedRow.id, { label: event.target.value })}
                    />
                    <div className="admin-segmented" role="group" aria-label="Label side">
                      {LABEL_SIDES.map(({ side, label }) => (
                        <button
                          key={side}
                          className={`admin-segmented-button${selectedRow.labelSide === side ? " active" : ""}`}
                          aria-pressed={selectedRow.labelSide === side}
                          disabled={saving}
                          onClick={() => updateRow(selectedRow.id, { labelSide: side })}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="admin-label photo-layout-section-label">Photos</p>
                {selectedRow.sizing !== "flex" && (
                  <p className="admin-card-subtitle photo-layout-hint">
                    Flex is off while photos in this row share the same {selectedRow.sizing}.
                  </p>
                )}
                <div className={`photo-layout-cells${selectedRow.sizing !== "flex" ? " flex-off" : ""}`}>
                  {selectedRow.cells.map((cell, cellIndex) => (
                    <div className="photo-layout-cell" key={cell.id}>
                      <img
                        className="photo-layout-thumb"
                        src={photosById.get(cell.photo)?.src}
                        alt=""
                        onLoad={measure(cell.photo)}
                      />
                      <span className="admin-label">Flex</span>
                      <button
                        className="photo-layout-step"
                        aria-label={`Decrease flex of photo ${cellIndex + 1}`}
                        disabled={cell.flex <= 1 || selectedRow.sizing !== "flex" || saving}
                        onClick={() =>
                          updateCells(selectedRow.id, (cells) =>
                            cells.map((c) => (c.id === cell.id ? { ...c, flex: c.flex - 1 } : c))
                          )
                        }
                      >
                        <MdRemove />
                      </button>
                      <span className="photo-layout-value">{cell.flex}</span>
                      <button
                        className="photo-layout-step"
                        aria-label={`Increase flex of photo ${cellIndex + 1}`}
                        disabled={cell.flex >= MAX_FLEX || selectedRow.sizing !== "flex" || saving}
                        onClick={() =>
                          updateCells(selectedRow.id, (cells) =>
                            cells.map((c) => (c.id === cell.id ? { ...c, flex: c.flex + 1 } : c))
                          )
                        }
                      >
                        <MdAdd />
                      </button>
                      <button
                        className="photo-layout-step photo-layout-cell-remove"
                        aria-label={`Remove photo ${cellIndex + 1}`}
                        disabled={saving}
                        onClick={() => {
                          if (selectedRow.cells.length === 1) setSelectedRowId(undefined);
                          updateCells(selectedRow.id, (cells) => cells.filter(({ id }) => id !== cell.id));
                        }}
                      >
                        <MdClose />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="admin-button-secondary photo-layout-add-photos"
                  disabled={saving}
                  onClick={() => openPicker(selectedRow.id)}
                >
                  <MdAdd /> Add photos
                </button>
              </>
            ) : (
              <>
                <p className="admin-card-title">Photo page layout</p>
                <p className="admin-card-subtitle">
                  This is the Photo page, top to bottom. Click a row to edit it here. Drag photos to reorder them or
                  move them to another row, and drag a row by its number to move it.
                </p>
                <p className="admin-card-subtitle">
                  Width and spacing are shares of the page width, and each photo's flex is its share of the row: flex 2
                  is twice as wide as flex 1.
                </p>
              </>
            )}

            {message && <p className={`admin-status ${message.kind}`}>{message.text}</p>}
          </aside>
        </div>

        {picking && (
          <div
            className="admin-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setPicking(undefined);
            }}
          >
            <section className="admin-card admin-modal" role="dialog" aria-modal="true" aria-label="Choose photos">
              <div className="photo-layout-header">
                <p className="admin-card-title">
                  {picking === NEW_ROW_ID ? "Add a row" : `Add photos to row ${pickingRowNumber}`}
                </p>
                <button className="admin-icon-button" aria-label="Close" onClick={() => setPicking(undefined)}>
                  <MdClose />
                </button>
              </div>
              {folders.length === 0 ? (
                <p className="admin-card-subtitle">Upload photos in the Photo tab first.</p>
              ) : (
                <>
                  <p className="admin-card-subtitle">
                    Click photos to select them, in the order they should appear. You can switch folders without losing
                    your selection.
                  </p>
                  <select
                    className="admin-input photo-layout-folder-select"
                    value={pickerFolder}
                    onChange={(event) => setPickerFolder(event.target.value)}
                  >
                    {library.map((collection) => (
                      <optgroup label={collection.title} key={collection.id}>
                        {collection.folders.map((folder) => (
                          <option value={folder.id} key={folder.id}>
                            {folder.title}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div className="photo-layout-picker">
                    {pickerPhotos.map((photo) => {
                      const order = selected.indexOf(photo.id) + 1;

                      return (
                        <button
                          className={`photo-layout-picker-photo${usedPhotos.has(photo.id) ? " used" : ""}${order ? " selected" : ""}`}
                          title={usedPhotos.has(photo.id) ? "Already in the layout" : undefined}
                          aria-pressed={order > 0}
                          onClick={() => toggleSelected(photo.id)}
                          key={photo.id}
                        >
                          <img src={photo.src} alt="" loading="lazy" onLoad={measure(photo.id)} />
                          {order > 0 && <span className="photo-layout-picker-badge">{order}</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="photo-layout-picker-footer">
                    <span className="admin-card-subtitle">{selected.length} selected</span>
                    <button className="admin-button" disabled={selected.length === 0} onClick={addSelected}>
                      Add {selected.length || ""} photo{selected.length === 1 ? "" : "s"}
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        )}

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
