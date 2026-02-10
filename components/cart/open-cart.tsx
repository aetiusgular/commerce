import clsx from "clsx";

export default function OpenCart({
  className,
  quantity,
  variant = "icon",
}: {
  className?: string;
  quantity?: number;
  variant?: "icon" | "text";
}) {
  if (variant === "text") {
    return (
      <button className="hover:opacity-60 transition-opacity whitespace-nowrap">
        CART ({quantity || 0})
      </button>
    );
  }

  return (
    <div className="relative flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors dark:border-neutral-700 dark:text-white">
      <svg
        className={clsx(
          "h-6 w-6 transition-all ease-in-out hover:scale-110",
          className,
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>

      {quantity ? (
        <div className="absolute right-0 top-0 -mr-2 -mt-2 h-4 w-4 rounded-sm bg-blue-600 text-[11px] font-medium text-white">
          {quantity}
        </div>
      ) : null}
    </div>
  );
}