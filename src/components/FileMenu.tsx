"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { ActionResult } from "@/lib/actions";
import { runAction } from "@/lib/runAction";

type Folder = { id: string; name: string };

// Three-dot menu for a file: move to a folder and (for doctor/admin) delete
export function FileMenu({
  folders,
  currentFolderId,
  moveAction,
  moveToNewFolderAction,
  deleteAction,
  buttonClassName = "text-zinc-600 hover:bg-zinc-100",
}: {
  folders: Folder[];
  currentFolderId: string | null;
  moveAction: (folderId: string | null) => Promise<ActionResult>;
  moveToNewFolderAction: (name: string) => Promise<ActionResult>;
  deleteAction?: () => Promise<ActionResult>;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) closeMenu();
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function closeMenu() {
    setOpen(false);
    setCreating(false);
    setNewName("");
  }

  function run(action: () => Promise<ActionResult>) {
    closeMenu();
    startTransition(() => runAction(action));
  }

  const itemClass = "block w-full px-3 py-1.5 text-left text-sm hover:bg-[#fff1e3] disabled:text-zinc-400";

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-label="More actions"
        disabled={pending}
        onClick={() => (open ? closeMenu() : setOpen(true))}
        className={`rounded-md px-2 py-1 text-base leading-none disabled:opacity-50 ${buttonClassName}`}
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-52 rounded-md border border-zinc-200 bg-white py-1 shadow-md">
          {creating ? (
            <form
              className="flex flex-col gap-2 px-3 py-2"
              onSubmit={(event) => {
                event.preventDefault();
                const name = newName.trim();
                if (name) run(() => moveToNewFolderAction(name));
              }}
            >
              <input
                autoFocus
                value={newName}
                maxLength={60}
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") closeMenu();
                }}
                placeholder="Folder name"
                className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="rounded-md bg-[#ff964f] px-3 py-1 text-xs font-medium text-white hover:bg-[#f2803a] disabled:opacity-50"
                >
                  Create and move
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setNewName("");
                  }}
                  className="text-xs text-zinc-500 hover:underline"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button type="button" onClick={() => setCreating(true)} className={`${itemClass} font-medium`}>
              + New folder…
            </button>
          )}
          <div className="my-1 border-t border-zinc-200" />
          <p className="px-3 py-1 text-xs text-zinc-500">Move to folder</p>
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              disabled={folder.id === currentFolderId}
              onClick={() => run(() => moveAction(folder.id))}
              className={itemClass}
            >
              {folder.name}
            </button>
          ))}
          <button
            type="button"
            disabled={currentFolderId === null}
            onClick={() => run(() => moveAction(null))}
            className={itemClass}
          >
            No folder
          </button>
          {deleteAction && (
            <>
              <div className="my-1 border-t border-zinc-200" />
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this file? This cannot be undone.")) {
                    run(deleteAction);
                  }
                }}
                className={`${itemClass} text-red-600`}
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
