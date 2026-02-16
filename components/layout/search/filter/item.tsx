"use client";

import clsx from "clsx";
import type { SortFilterItem } from "lib/constants";
import { createUrl } from "lib/utils";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ListItem, PathFilterItem } from ".";

function PathFilterItem({ item }: { item: PathFilterItem }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Separate the item's pathname from its query params
  const [itemPathname = '', itemSearch] = item.path.split('?');
  const itemParams = new URLSearchParams(itemSearch || '');

  // Build new params: start from current search params, then override with item's params
  const newParams = new URLSearchParams(searchParams.toString());
  newParams.delete("q");
  itemParams.forEach((value, key) => {
    newParams.set(key, value);
  });

  // Check if this filter is currently active
  const href = createUrl(itemPathname, newParams);
  const isActive = (() => {
    if (itemPathname !== pathname) return false;
    // Check that all item params match current search params
    for (const [key, value] of itemParams.entries()) {
      if (searchParams.get(key) !== value) return false;
    }
    return true;
  })();

  const DynamicTag = isActive ? "p" : Link;

  return (
    <li className="mt-2 flex text-black dark:text-black" key={item.title}>
      <DynamicTag
        href={href}
        className={clsx(
          "w-full text-sm underline-offset-4 hover:underline dark:hover:text-black",
          {
            "underline underline-offset-4": isActive,
          },
        )}
      >
        {item.title}
      </DynamicTag>
    </li>
  );
}

function SortFilterItem({ item }: { item: SortFilterItem }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("sort") === item.slug;
  const q = searchParams.get("q");
  const href = createUrl(
    pathname,
    new URLSearchParams({
      ...(q && { q }),
      ...(item.slug && item.slug.length && { sort: item.slug }),
    }),
  );
  const DynamicTag = active ? "p" : Link;

  return (
    <li
      className="mt-2 flex text-sm text-black dark:text-black"
      key={item.title}
    >
      <DynamicTag
        prefetch={!active ? false : undefined}
        href={href}
        className={clsx("w-full hover:underline hover:underline-offset-4", {
          "underline underline-offset-4": active,
        })}
      >
        {item.title}
      </DynamicTag>
    </li>
  );
}

export function FilterItem({ item }: { item: ListItem }) {
  return "path" in item ? (
    <PathFilterItem item={item} />
  ) : (
    <SortFilterItem item={item} />
  );
}
