"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Category } from "@/types/music";

interface CategoryTabsProps {
  categories: Category[];
  loading: boolean;
  selectedCategory: string;
  onSelect: (category: string) => void;
}

export function CategoryTabs({ categories, loading, selectedCategory, onSelect }: CategoryTabsProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="size-4 animate-spin text-teal-600" />
        <span className="text-sm text-stone-400 font-medium">Loading categories...</span>
      </div>
    );
  }

  if (categories.length === 0) {
    return <p className="text-sm text-stone-500 italic">Add a lesson to create your first category.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      {categories.map((c) => (
        <button
          key={c.name}
          onClick={() => onSelect(c.name)}
          className={`h-9 rounded-full px-4 text-xs font-semibold uppercase tracking-wider transition-all sm:h-8 flex items-center gap-2 ${
            selectedCategory === c.name 
              ? "bg-teal-600 shadow-md shadow-teal-900/10 text-white hover:bg-teal-700" 
              : "border border-stone-200 bg-white text-stone-600 hover:border-teal-200 hover:bg-teal-50/50 hover:text-teal-700"
          }`}
        >
          {c.name}
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
            selectedCategory === c.name ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
          }`}>
            {c.count}
          </span>
        </button>
      ))}
    </div>
  );
}
