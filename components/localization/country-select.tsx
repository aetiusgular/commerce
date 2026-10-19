"use client";

import { COUNTRIES, type CountryCode } from "lib/localization-shared";
import { useTransition } from "react";
import { setCountry } from "./actions";

export function CountrySelect({ current }: { current: CountryCode }) {
  const [pending, start] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="opacity-60">Ship to</span>
      <select
        aria-label="Shipping country and currency"
        className="bg-transparent underline underline-offset-2 decoration-black/40 hover:decoration-black disabled:opacity-40"
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
    </label>
  );
}
