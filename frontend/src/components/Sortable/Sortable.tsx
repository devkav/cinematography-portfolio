import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type DragHandleProps = HTMLAttributes<HTMLElement>;

export function useDragSensors() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
}

export function SortableList({ ids, children }: { ids: string[]; children: ReactNode }) {
  return (
    <SortableContext items={ids} strategy={rectSortingStrategy}>
      {children}
    </SortableContext>
  );
}

interface ItemProps {
  id: string;
  type: string;
  acceptsType?: string;
  className: string;
  disabled?: boolean;
  children: (dragHandleProps: DragHandleProps) => ReactNode;
}

export function SortableItem({ id, type, acceptsType, className, disabled, children }: ItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver, active } = useSortable({
    id,
    data: { type },
    disabled
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const isDropTarget = isOver && acceptsType !== undefined && active?.data.current?.type === acceptsType;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className}${isDragging ? " is-sorting" : ""}${isDropTarget ? " is-drop-target" : ""}`}
    >
      {children({ ...attributes, ...listeners } as DragHandleProps)}
    </div>
  );
}
