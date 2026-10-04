"use client";

import { useState } from "react";

const KNOWN_SPECIES = ["Dog", "Cat", "Rabbit", "Bird", "Fish"];

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500";

export function SpeciesField({
  defaultValue = "Dog",
  className,
}: {
  defaultValue?: string;
  className?: string;
}) {
  const isKnown = KNOWN_SPECIES.includes(defaultValue);
  const [isOther, setIsOther] = useState(!isKnown);

  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        Species
        <select
          name={isOther ? undefined : "species"}
          className={inputClass}
          defaultValue={isOther ? "Other" : defaultValue}
          onChange={(e) => setIsOther(e.target.value === "Other")}
        >
          {KNOWN_SPECIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
      </label>
      {isOther && (
        <input
          name="species"
          defaultValue={isKnown ? "" : defaultValue}
          placeholder="Enter the animal species"
          className={inputClass}
        />
      )}
    </div>
  );
}
