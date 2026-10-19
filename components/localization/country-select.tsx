"use client";

import { COUNTRIES, type CountryCode } from "lib/localization-shared";
import { useTransition } from "react";
import { setCountry } from "./actions";

/**
 * Footer "Ship to" picker. The visible part is a plain text label with a
 * chevron, sized to the selected country only. A transparent native <select>
 * sits on top of it, so the control keeps native keyboard, screen-reader and
 * mobile picker behaviour without the select's own width (which is set by
 * the longest option) pushing into the rest of the footer.
 */
export function CountrySelect({ current }: { current: CountryCode }) {
  const [pending, start] = useTransition();
  const name = COUNTRIES.find((c) => c.code === current)?.name ?? current;

  return (
    <div
      className="relative inline-flex h-5 w-fit items-center gap-1.5 rounded-[2px] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-black"
      aria-busy={pending || undefined}
    >
      <span
        aria-hidden="true"
        className={`underline decoration-black/40 underline-offset-2 ${pending ? "opacity-60" : ""}`}
      >
        {name}
      </span>
      <svg
        aria-hidden="true"
        width="8"
        height="8"
        viewBox="0 0 8 8"
        fill="none"
        className="shrink-0"
      >
        <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1" />
      </svg>
      <select
        aria-labelledby="ship-to-label"
        className="absolute inset-0 w-full cursor-pointer appearance-none opacity-0 disabled:cursor-wait"
        value={current}
        disabled={pending}
        onChange={(e) => {
          const code = e.target.value;
          start(() => setCountry(code));
        }}
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
