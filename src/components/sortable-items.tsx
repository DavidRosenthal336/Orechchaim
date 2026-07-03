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
import { Check, GripVertical, Trash2 } from "lucide-react";
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
  const [value, setValue] = useState(item.label);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isPending, startTransition] = useTransition();

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  // Re-sync from the server (e.g. after a saved reorder) and size to fit.
  useEffect(() => {
    setValue(item.label);
  }, [item.label]);
  useEffect(() => {
    if (textareaRef.current) autoGrow(textareaRef.current);
  }, [value]);

  // Clear the "Saved" confirmation after a moment.
  useEffect(() => {
    if (status !== "saved") return;
    const t = setTimeout(() => setStatus("idle"), 2500);
    return () => clearTimeout(t);
  }, [status]);

  const trimmed = value.trim();
  const dirty = trimmed !== item.label.trim();

  // Auto-save when the field loses focus. Empties revert; unchanged text is a
  // no-op (no flash).
  function commit() {
    if (isPending) return;
    if (trimmed.length === 0) {
      setValue(item.label); // can't save an empty item — put it back
      return;
    }
    if (!dirty) return;
    const fd = new FormData();
    fd.set("templateId", templateId);
    fd.set("itemId", item.id);
    fd.set("label", value);
    setStatus("saving");
    startTransition(async () => {
      await updateItem(fd);
      setStatus("saved");
    });
  }

  function remove() {
    const fd = new FormData();
    fd.set("templateId", templateId);
    fd.set("itemId", item.id);
    startTransition(async () => {
      await deleteItem(fd);
    });
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-1.5 rounded-lg border border-border bg-surface px-1.5 py-1.5",
        isDragging && "z-10 opacity-80 shadow",
        dirty && "border-accent/60",
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

      <div className="flex flex-1 items-start gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          onInput={(e) => autoGrow(e.currentTarget)}
          onBlur={commit}
          maxLength={200}
          rows={1}
          dir="ltr"
          className="min-h-[2.25rem] w-full resize-none overflow-hidden break-words rounded-lg border border-border bg-surface px-2.5 py-2 text-left text-sm leading-snug"
        />

        {/* Tiny transient save indicator; the row otherwise has just the trash. */}
        {status === "saving" || status === "saved" ? (
          <span
            className={cn(
              "mt-2 shrink-0 text-xs",
              status === "saved" ? "text-positive" : "text-muted",
            )}
            aria-live="polite"
          >
            {status === "saved" ? (
              <Check className="h-4 w-4" strokeWidth={3} />
            ) : (
              "…"
            )}
          </span>
        ) : null}

        <button
          type="button"
          onClick={remove}
          disabled={isPending}
          aria-label="Delete item"
          className="mt-1 shrink-0 rounded-lg p-1.5 text-muted hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
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
