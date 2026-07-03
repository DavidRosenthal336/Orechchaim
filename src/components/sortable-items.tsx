"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { updateItem, deleteItem, reorderItems } from "@/app/actions/templates";
import { cn } from "@/lib/utils";

type Item = { id: string; label: string };

function Row({ item, templateId }: { item: Item; templateId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }
  // Size to fit the initial value (and whenever it changes from the server).
  useEffect(() => {
    if (textareaRef.current) autoGrow(textareaRef.current);
  }, [item.label]);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border border-border bg-surface px-1.5 py-1.5",
        isDragging && "z-10 opacity-80 shadow",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="mt-1 shrink-0 cursor-grab touch-none rounded-md p-1.5 text-muted hover:bg-surface-2"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <form action={updateItem} className="flex flex-1 items-start gap-2">
        <input type="hidden" name="templateId" value={templateId} />
        <input type="hidden" name="itemId" value={item.id} />
        <textarea
          ref={textareaRef}
          name="label"
          defaultValue={item.label}
          maxLength={200}
          rows={1}
          dir="auto"
          onInput={(e) => autoGrow(e.currentTarget)}
          className="min-h-[2.25rem] w-full resize-none overflow-hidden break-words rounded-lg border border-border bg-surface px-2.5 py-2 text-sm leading-snug"
        />
        <button
          type="submit"
          className="mt-1 shrink-0 rounded-lg px-2 text-xs font-medium text-accent hover:bg-accent-soft"
        >
          Save
        </button>
        <button
          type="submit"
          formAction={deleteItem}
          aria-label="Delete item"
          className="mt-1 shrink-0 rounded-lg p-1.5 text-muted hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </form>
    </li>
  );
}

export function SortableItems({
  templateId,
  items: initial,
}: {
  templateId: string;
  items: Item[];
}) {
  const [items, setItems] = useState(initial);
  const [, startTransition] = useTransition();

  // Re-sync when the server data changes (add / delete / saved reorder).
  const sig = JSON.stringify(initial.map((i) => [i.id, i.label]));
  useEffect(() => {
    setItems(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      const next = arrayMove(prev, oldIndex, newIndex);
      startTransition(() =>
        reorderItems(
          templateId,
          next.map((i) => i.id),
        ),
      );
      return next;
    });
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted">No items yet. Add some below.</p>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-2">
          {items.map((item) => (
            <Row key={item.id} item={item} templateId={templateId} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
