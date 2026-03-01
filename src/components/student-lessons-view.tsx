"use client";

import { useState, useMemo } from "react";
import { Music2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LessonCard } from "@/components/lesson-card";
import { lessonMatchesSearch } from "@/lib/lesson-search";

export type LessonForCard = {
  id: string;
  lyrics: string;
  title?: string | null;
  raaga?: string | null;
  thala?: string | null;
  created_at: string;
};

export type CategoryGroup = {
  category: string;
  lessons: LessonForCard[];
};

export function StudentLessonsView({ groups }: { groups: CategoryGroup[] }) {
  const [category, setCategory] = useState<string>(() => groups[0]?.category ?? "");
  const [searchQuery, setSearchQuery] = useState("");

  const currentGroup = groups.find((g) => g.category === category) ?? groups[0];
  const allLessons = currentGroup?.lessons ?? [];
  const lessons = useMemo(
    () => allLessons.filter((l) => lessonMatchesSearch(l, searchQuery)),
    [allLessons, searchQuery]
  );

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-200 bg-white/80 px-8 py-20 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
          <Music2 className="size-8 text-stone-400" />
        </div>
        <p className="mt-4 font-medium text-stone-600">No lessons yet</p>
        <p className="mt-1 text-sm text-stone-500">Your teacher will send lessons here</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2.5">
        {groups.map((g) => (
          <Button
            key={g.category}
            variant={category === g.category ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(g.category)}
            className={`h-9 rounded-full px-5 text-xs font-black uppercase tracking-wider transition-all sm:h-8 ${
              category === g.category 
                ? "bg-teal-600 shadow-md shadow-teal-900/10 hover:bg-teal-700" 
                : "border-stone-200 bg-white text-stone-500 hover:border-teal-200 hover:bg-teal-50/50 hover:text-teal-700"
            }`}
          >
            {g.category}
            <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${
              category === g.category ? "bg-white/20 text-white" : "bg-stone-100 text-stone-400"
            }`}>
              {g.lessons.length}
            </span>
          </Button>
        ))}
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
        <Input
          type="search"
          placeholder={`Search in ${category}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 border-stone-200 bg-white pl-11 shadow-sm transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10 placeholder:text-stone-400"
          aria-label="Search lessons"
        />
      </div>

      <div className="space-y-6">
        {category && (
          <div className="flex items-center gap-4 px-2">
            <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-stone-400">
              {category}
            </h2>
            <div className="h-px flex-1 bg-stone-100" />
          </div>
        )}
        
        <div className="grid gap-4">
          {lessons.length > 0 ? (
            lessons.map((l) => (
              <LessonCard
                key={l.id}
                lesson={{
                  id: l.id,
                  lyrics: l.lyrics,
                  title: l.title,
                  raaga: l.raaga,
                  thala: l.thala,
                  created_at: l.created_at,
                }}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-stone-100 bg-stone-50/30 py-20 px-6 text-center">
              <p className="text-sm font-bold text-stone-400 italic">
                {searchQuery.trim() ? "No matches found for your search." : "No lessons in this category yet"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
