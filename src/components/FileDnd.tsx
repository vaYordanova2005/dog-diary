"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { ActionResult } from "@/lib/actions";
import { runAction } from "@/lib/runAction";

const DRAG_TYPE = "application/x-attachment-id";

// A file that can be grabbed and dropped onto a folder
export function DraggableFile({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
  const [dragging, setDragging] = useState(false);
  return (
    <li
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(DRAG_TYPE, id);
        event.dataTransfer.effectAllowed = "move";
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={`${className ?? ""} cursor-grab ${dragging ? "opacity-50" : ""}`}
    >
      {children}
    </li>
  );
}

// A place where files are dropped (a folder or "No folder").
// Files from the computer are only highlighted here — their upload is caught by AttachmentUploader,
// which reads data-folder-id to put them straight into the folder.
export function DropTarget({
  as: Tag,
  folderId,
  moveAction,
  className,
  children,
}: {
  as: "details" | "div";
  folderId?: string;
  moveAction: (attachmentId: string) => Promise<ActionResult>;
  className?: string;
  children: ReactNode;
}) {
  const [over, setOver] = useState(false);
  const [pending, startTransition] = useTransition();

  const isFileDrag = (event: React.DragEvent) => event.dataTransfer.types.includes(DRAG_TYPE);
  const isUpload = (event: React.DragEvent) => event.dataTransfer.types.includes("Files");

  return (
    <Tag
      data-folder-id={folderId}
      onDragOver={(event: React.DragEvent) => {
        if (isUpload(event)) setOver(true);
        if (!isFileDrag(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={(event: React.DragEvent) => {
        // Ignores passing over the children (otherwise the border flickers)
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={(event: React.DragEvent) => {
        setOver(false);
        if (!isFileDrag(event)) return;
        event.preventDefault();
        const id = event.dataTransfer.getData(DRAG_TYPE);
        if (id) startTransition(() => runAction(() => moveAction(id)));
      }}
      className={`${className ?? ""} ${over ? "border-[#ff964f]! bg-[#fbe4cf]!" : ""} ${pending ? "opacity-60" : ""}`}
    >
      {children}
    </Tag>
  );
}
