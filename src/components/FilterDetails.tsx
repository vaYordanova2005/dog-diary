"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function FilterDetails({
  hasActiveFilters,
  children,
}: {
  hasActiveFilters: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        ref.current.open = false;
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <details ref={ref} className="relative">
      <summary
        className={`flex cursor-pointer list-none items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium text-zinc-700 ${
          hasActiveFilters
            ? "border-[#f2803a] bg-[#ffceac]"
            : "border-[#fbe4cf] bg-[#fff1e3] hover:bg-[#ffceac]"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 .8 1.6l-6.3 8.4a1 1 0 0 0-.2.6v5.4a1 1 0 0 1-.4.8l-3 2.25A1 1 0 0 1 9 21v-6.4a1 1 0 0 0-.2-.6L2.2 5.6A1 1 0 0 1 3 4Z" />
        </svg>
        Filter
      </summary>
      {children}
    </details>
  );
}
