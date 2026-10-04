"use client";

import { useState, type ReactNode } from "react";

export function EditableSection({
  title,
  view,
  form,
  open,
  onToggle,
}: {
  title: string;
  view: ReactNode;
  form: ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <section className="mb-6 rounded-lg border border-[#fbe4cf] bg-[#fff1e3] p-5">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className={`flex cursor-pointer select-none items-center justify-between gap-3 ${open ? "mb-4" : ""}`}
      >
        <h2 className="font-medium text-zinc-800">{title}</h2>
        <div className="flex items-center gap-3">
          {!editing && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              className="rounded-md bg-[#ff964f] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#f2803a]"
            >
              Edit
            </button>
          )}
          <span className={`text-zinc-500 transition-transform ${open ? "rotate-90" : ""}`}>›</span>
        </div>
      </div>
      {open &&
        (editing ? (
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
          view
        ))}
    </section>
  );
}
