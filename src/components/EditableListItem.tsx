"use client";

import { useState, type ReactNode } from "react";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

export function EditableListItem({
  view,
  form,
  deleteAction,
  canDelete = true,
}: {
  view: ReactNode;
  form: ReactNode;
  deleteAction: () => Promise<void>;
  canDelete?: boolean;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="rounded-md border border-zinc-200 bg-white p-3 text-sm">
      {editing ? (
        <div className="flex flex-col gap-3">
          {form}
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="self-start text-xs text-zinc-500 hover:underline"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          {view}
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-md bg-[#ff964f] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#f2803a]"
            >
              Edit
            </button>
            {canDelete && (
              <form action={deleteAction}>
                <ConfirmSubmitButton
                  message="Are you sure you want to delete this record? This cannot be undone."
                  className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs text-red-600 hover:bg-red-100"
                >
                  Delete
                </ConfirmSubmitButton>
              </form>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
