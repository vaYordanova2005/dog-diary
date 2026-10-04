"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/actions";
import { runAction } from "@/lib/runAction";

// Renaming and deleting a folder. Deleting does not delete the files — they end up with no folder.
export function FolderMenu({
  name,
  renameAction,
  deleteAction,
}: {
  name: string;
  renameAction: (name: string) => Promise<ActionResult>;
  deleteAction: () => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(name);
  // Same buttons as when editing/deleting examinations, vaccinations and medications
  const editClass =
    "rounded-md bg-[#ff964f] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#f2803a] disabled:opacity-50";
  const deleteClass =
    "rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs text-red-600 hover:bg-red-100 disabled:opacity-50";

  if (renaming) {
    return (
      <form
        className="flex shrink-0 items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const next = draft.trim();
          setRenaming(false);
          if (next && next !== name) startTransition(() => runAction(() => renameAction(next)));
        }}
      >
        <input
          autoFocus
          value={draft}
          maxLength={60}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setRenaming(false);
          }}
          className="w-40 rounded-md border border-zinc-300 px-2 py-1 text-sm font-normal outline-none focus:border-zinc-500"
        />
        <button
          type="submit"
          className={editClass}
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setRenaming(false)}
          className="text-xs font-normal text-zinc-500 hover:underline"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setDraft(name);
          setRenaming(true);
        }}
        className={editClass}
      >
        Rename
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm(`Delete the folder “${name}”? The files in it will not be deleted — they will stay with no folder.`)) {
            startTransition(() => runAction(deleteAction));
          }
        }}
        className={deleteClass}
      >
        Delete folder
      </button>
    </div>
  );
}
