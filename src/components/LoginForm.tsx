"use client";

import { useState } from "react";
import { PasswordField } from "./PasswordField";

type Mode = "select" | "doctor" | "intern" | "manual";

const roleLabel: Record<"doctor" | "intern", string> = {
  doctor: "Doctor",
  intern: "Intern",
};

const bigButtonClass =
  "w-full rounded-full bg-[#fac898] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#f19c47]";

export function LoginForm({
  action,
  demoMode = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  demoMode?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("select");

  // Demo mode: one click signs in, no password. The server ignores the "demo" flag
  // unless DEMO_MODE is on (see src/lib/demo.ts).
  if (demoMode) {
    return (
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="demo" value="true" />
        <button type="submit" name="username" value="doctor" className={bigButtonClass}>
          Continue as doctor
        </button>
        <button type="submit" name="username" value="intern" className={bigButtonClass}>
          Continue as intern
        </button>
        <p className="mt-2 text-xs text-zinc-500">
          Demo with made-up data. Doctors can delete records, interns cannot.
        </p>
      </form>
    );
  }

  if (mode === "select") {
    return (
      <div className="flex flex-col gap-3">
        <button type="button" onClick={() => setMode("doctor")} className={bigButtonClass}>
          Continue as doctor
        </button>
        <button type="button" onClick={() => setMode("intern")} className={bigButtonClass}>
          Continue as intern
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className="mt-1 text-sm font-medium text-[#c2570a] hover:underline"
        >
          Sign in with another account
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4 text-left">
      <button
        type="button"
        onClick={() => setMode("select")}
        className="self-start text-sm font-medium text-[#c2570a] hover:underline"
      >
        ← Switch account
      </button>

      {mode === "manual" ? (
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          placeholder="Username"
          className="w-full rounded-full border border-transparent bg-zinc-100 py-3 px-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-[#fac898] focus:bg-white"
        />
      ) : (
        <>
          <p className="-mb-2 text-sm font-medium text-zinc-700">
            Sign in as {roleLabel[mode]}
          </p>
          <input type="hidden" name="username" value={mode} />
        </>
      )}

      <PasswordField />

      <label className="flex items-center gap-2 text-sm text-zinc-500">
        <input
          type="checkbox"
          name="remember"
          defaultChecked
          className="h-4 w-4 rounded border-zinc-300 text-[#f19c47] focus:ring-[#fac898]"
        />
        Remember me
      </label>

      <button type="submit" className={`${bigButtonClass} mt-2`}>
        Sign in
      </button>
    </form>
  );
}
