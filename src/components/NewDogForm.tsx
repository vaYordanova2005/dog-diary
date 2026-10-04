"use client";

import { useState, type ReactNode } from "react";

// Checks before submitting that an owner is selected or a new owner's name is entered —
// so the entered data isn't lost on an error.
export function NewDogForm({
  action,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  className?: string;
  children: ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={action}
      className={className}
      onSubmit={(event) => {
        const data = new FormData(event.currentTarget);
        const ownerId = String(data.get("ownerId") ?? "").trim();
        const newOwnerName = String(data.get("newOwnerName") ?? "").trim();
        if (!ownerId && !newOwnerName) {
          event.preventDefault();
          setError("Choose an existing owner or enter the name of a new owner.");
          return;
        }
        setError(null);
      }}
    >
      {children}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
    </form>
  );
}
