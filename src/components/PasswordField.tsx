"use client";

import { useState } from "react";

export function PasswordField({
  id = "password",
  name = "password",
  placeholder = "Password",
  autoComplete = "current-password",
}: {
  id?: string;
  name?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </span>
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-full border border-transparent bg-zinc-100 py-3 pl-10 pr-11 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-[#fac898] focus:bg-white"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
      >
        {visible ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M3 3l18 18" />
            <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
            <path d="M9.88 5.09A9.77 9.77 0 0 1 12 5c5 0 9 4 10 7a12.9 12.9 0 0 1-3.16 4.3M6.1 6.1C3.86 7.6 2.2 9.8 2 12c1 3 5 7 10 7a9.7 9.7 0 0 0 3.9-.8" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
