"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronDown } from "lucide-react";

interface Product {
  id: string;
  name: string;
  code: string;
  unit: string;
  sellPrice: number;
  stock: number;
}

interface Props {
  outletId: string;
  value: string;
  onSelect: (product: Product) => void;
  placeholder?: string;
}

export function ProductTypeahead({ outletId, value, onSelect, placeholder = "Search product..." }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // When value is cleared externally
  useEffect(() => {
    if (!value) {
      setSelectedProduct(null);
      setQuery("");
    }
  }, [value]);

  function handleInput(q: string) {
    setQuery(q);
    setSelectedProduct(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}&outletId=${encodeURIComponent(outletId)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setOpen(true);
      }
    }, 200);
  }

  function handleSelect(p: Product) {
    setSelectedProduct(p);
    setQuery(p.name);
    setResults([]);
    setOpen(false);
    onSelect(p);
  }

  function handleClear() {
    setSelectedProduct(null);
    setQuery("");
    setResults([]);
    setOpen(false);
    onSelect({ id: "", name: "", code: "", unit: "", sellPrice: 0, stock: 0 });
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          className="w-full border border-gray-300 dark:border-slate-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {selectedProduct ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        )}
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-slate-400">No products found</div>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={() => handleSelect(p)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-b border-gray-100 dark:border-slate-700 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-slate-100">{p.name}</span>
                    <span className="ml-2 text-xs text-gray-400 dark:text-slate-500">({p.code})</span>
                  </div>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{p.unit}</span>
                </div>
                <div className="flex items-center gap-4 mt-0.5">
                  <span className="text-xs text-gray-500 dark:text-slate-400">Price: {p.sellPrice.toFixed(2)}</span>
                  <span className={`text-xs font-medium ${p.stock <= 0 ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
                    Stock: {p.stock}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
