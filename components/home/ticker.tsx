type TickerItem = { text: string; live?: boolean };

const ITEMS: TickerItem[] = [
  { text: "Issue 14 — Spring / Summer 2026" },
  { text: "Free shipping over $300" },
  { text: "AGMNT Radio — Live now", live: true },
  { text: "New arrivals — Auralee, Lemaire, Our Legacy" },
  { text: "Editorial — The Quiet Uniform" },
  { text: "Studio hours 10:00 — 19:00 PST" },
];

export function Ticker() {
  // Duplicate the items so the looped translateX(-50%) animation is seamless.
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div className="border-y border-black/20 overflow-hidden">
      <div className="flex w-max animate-ticker">
        {doubled.map((it, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-6 py-3 font-vremena text-xs tracking-[-0.02em] whitespace-nowrap"
          >
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                it.live ? "bg-red-600 animate-pulse" : "bg-black/30"
              }`}
            />
            <span>{it.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
