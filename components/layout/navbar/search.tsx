"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Cross1Icon } from "@radix-ui/react-icons";
import { Command } from "cmdk";
import { useEffect, useState } from "react";
import "./search.css";

interface Product {
  id: string;
  title: string;
  handle: string;
  priceRange: {
    minVariantPrice: {
      amount: string;
    };
  };
}

interface Collection {
  id: string;
  title: string;
  handle: string;
}

export default function Search({ isMobile = false }: { isMobile?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      fetchCollections();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = products.filter((product) =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      setProducts(data.products || []);
      setFilteredProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch("/api/collections");
      const data = await response.json();
      // Filter out the "All" collection (handle === "")
      const filteredCollections = (data.collections || []).filter(
        (c: Collection) => c.handle !== ""
      );
      setCollections(filteredCollections);
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  };

  const handleCategoryClick = async (handle: string) => {
    try {
      // If handle is empty or "all", show all products
      if (!handle || handle === "" || handle.toLowerCase() === "all") {
        setFilteredProducts(products);
        setSearchQuery("");
        return;
      }

      const response = await fetch(`/api/collections/${handle}`);
      const data = await response.json();
      
      if (data.products && data.products.length > 0) {
        setFilteredProducts(data.products);
      } else {
        // If no products found, show empty array
        setFilteredProducts([]);
      }
    } catch (error) {
      console.error("Error fetching collection products:", error);
      setFilteredProducts([]);
    }
  };

  if (isOpen) {
    return (
      <Command className="fixed inset-0 z-50 w-full h-screen bg-white">
        <div className="flex flex-col w-full h-screen bg-white text-black text-lg font-vremena tracking-[-0.01em]">
          {/* Search Header */}
          <div className="flex flex-row justify-between p-4 border-b-[0.25px] border-black/10">
            <Command.Input
              placeholder="... SEARCH"
              className="w-full text-xl outline-none bg-transparent"
              autoFocus
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <button onClick={() => setIsOpen(false)}>
              <Cross1Icon className="w-4 h-4 hover:cursor-pointer text-black/60 hover:text-black" />
            </button>
          </div>

          {/* Search Content */}
          <div className="flex flex-row flex-1 overflow-hidden">
            {/* Left - Categories */}
            <div className="w-[200px] min-w-[200px] border-r-[0.25px] border-black/10 overflow-y-auto overflow-x-hidden">
              <div className="p-6 text-sm">
                <div className="search-group space-y-2">
                  <button
                    className="search-item w-full text-left hover:opacity-60 transition-opacity"
                    onClick={() => {
                      setFilteredProducts(products);
                      setSearchQuery("");
                    }}
                  >
                    All Products
                  </button>
                  {collections.map((collection) => (
                    <button
                      key={collection.handle}
                      className="search-item w-full text-left hover:opacity-60 transition-opacity break-words"
                      onClick={() => handleCategoryClick(collection.handle)}
                    >
                      {collection.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right - Products */}
            <div className="flex-1 overflow-y-auto">
              <Command.List className="p-8">
                <Command.Empty className="text-sm text-gray-500">
                  No results found
                </Command.Empty>
                <Command.Group className="search-group grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-4">
                  {filteredProducts.map((product) => (
                    <Command.Item
                      key={product.handle}
                      value={product.title}
                      className="search-item cursor-pointer hover:opacity-60 py-2 w-full transition-opacity"
                      onSelect={() => {
                        window.location.href = `/product/${product.handle}`;
                      }}
                    >
                      <div className="flex justify-between items-start gap-4 w-full">
                        <span className="flex-1 break-words">{product.title}</span>
                        <span className="whitespace-nowrap flex-shrink-0">
                          ${parseFloat(product.priceRange.minVariantPrice.amount).toFixed(0)}
                        </span>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </div>
          </div>
        </div>
      </Command>
    );
  }

  // Mobile Icon Button
  if (isMobile) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center"
        aria-label="Open search"
      >
        <MagnifyingGlassIcon className="w-8 h-8" />
      </button>
    );
  }

  // Desktop Text Button
  return (
    <button
      onClick={() => setIsOpen(true)}
      className="hover:opacity-60 transition-opacity"
    >
      SEARCH
    </button>
  );
}

export function SearchSkeleton() {
  return <button className="hover:opacity-60 transition-opacity">SEARCH</button>;
}