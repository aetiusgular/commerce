"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface FilterSection {
  title: string;
  items: Array<{ title: string; path: string }>;
}

export default function FilterItemDropdown({ sections }: { sections: FilterSection[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [openSelect, setOpenSelect] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpenSelect(false);
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const handleFilterReset = () => {
    router.push("/shop");
    setOpenSelect(false);
  };

  const handleItemClick = (path: string) => {
    router.push(path);
    setOpenSelect(false);
  };

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => {
          setOpenSelect(!openSelect);
        }}
        className="flex w-full items-center justify-between rounded-sm border border-black/30 px-4 py-2 text-sm dark:border-black/30"
      >
        <div>Filters</div>
        <ChevronDownIcon className="h-4" />
      </div>
      {openSelect && (
        <div className="absolute z-40 w-full rounded-b-md bg-white shadow-md max-h-[80vh] overflow-y-auto dark:bg-white">
          {/* Filter Reset Button */}
          <div className="sticky top-0 bg-white border-b border-black/10 p-4">
            <button
              onClick={handleFilterReset}
              className="w-full text-sm font-medium uppercase tracking-tight text-center py-2 border border-black/30 hover:bg-black hover:text-white transition-colors"
            >
              Filter Reset
            </button>
          </div>

          {/* Filter Sections */}
          <div className="p-4">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-6 last:mb-0">
                <h3 className="text-sm font-medium uppercase tracking-tight mb-3">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <button
                        onClick={() => handleItemClick(item.path)}
                        className="w-full text-left text-sm hover:opacity-60 transition-opacity"
                      >
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}