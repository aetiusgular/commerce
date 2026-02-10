"use client";

import { SortFilterItem } from "lib/constants";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { FilterItem } from "./item";

export type ListItem = SortFilterItem | PathFilterItem;
export type PathFilterItem = { title: string; path: string };

function FilterItemList({ list }: { list: ListItem[] }) {
  return (
    <>
      {list.map((item: ListItem, i) => (
        <FilterItem key={i} item={item} />
      ))}
    </>
  );
}

function FilterTitle({ title }: { title: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleReset = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (title.toLowerCase() === "categories") {
      router.push("/shop");
    } else if (title.toLowerCase() === "brands") {
      params.delete("vendor");
      router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`);
    } else if (title.toLowerCase() === "colors") {
      params.delete("color");
      router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`);
    }
  };

  return (
    <h3 
      className="hidden text-sm font-medium uppercase tracking-tight mb-4 md:block cursor-pointer hover:opacity-60 transition-opacity"
      onClick={handleReset}
    >
      {title}
    </h3>
  );
}

export default function FilterList({
  list,
  title,
}: {
  list: ListItem[];
  title?: string;
}) {
  return (
    <>
      <nav>
        {title ? <FilterTitle title={title} /> : null}
        <ul className="hidden md:block space-y-2">
          <Suspense fallback={null}>
            <FilterItemList list={list} />
          </Suspense>
        </ul>
      </nav>
    </>
  );
}