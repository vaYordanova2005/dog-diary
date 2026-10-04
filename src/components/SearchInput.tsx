"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// A search box that updates the list as you type (with a short delay after the last letter).
// The other filters (species, breed, gender) from the URL are kept.
export function SearchInput({
  defaultValue,
  placeholder,
  className,
}: {
  defaultValue: string;
  placeholder: string;
  className: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Values we ourselves put into the URL that haven't "arrived" yet. If the database
  // is slow, an older request of ours may arrive while the person is already typing further —
  // it must not set the field back.
  const lastPushed = useRef(defaultValue.trim());
  const inFlight = useRef(new Set<string>());
  const urlQuery = searchParams.get("q") ?? "";

  useEffect(() => () => clearTimeout(timer.current), []);

  // If the URL changes from outside (e.g. "Clear" in the filter), the field follows it
  useEffect(() => {
    if (urlQuery === lastPushed.current) {
      inFlight.current.clear(); // all of ours has arrived
      return;
    }
    if (inFlight.current.has(urlQuery)) return; // an old value of ours — skip it
    lastPushed.current = urlQuery;
    inFlight.current.clear();
    clearTimeout(timer.current);
    setValue(urlQuery);
  }, [urlQuery]);

  function update(next: string) {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      lastPushed.current = next.trim();
      inFlight.current.add(next.trim());
      const params = new URLSearchParams(searchParams.toString());
      if (next.trim()) params.set("q", next.trim());
      else params.delete("q");
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    }, 300);
  }

  return (
    <input
      type="text"
      name="q"
      value={value}
      onChange={(event) => update(event.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      className={className}
    />
  );
}
