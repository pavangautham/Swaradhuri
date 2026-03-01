"use client";

import { 
  Music, 
  ChevronRight, 
  ChevronDown, 
  Send, 
  Pencil, 
  Trash2, 
  FileText,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LibraryItem } from "@/types/music";
import { LibraryAudioPlayer } from "./LibraryAudioPlayer";
import { LibraryLyricsImages } from "./LibraryLyricsImages";

interface LibraryItemCardProps {
  item: LibraryItem;
  onEdit: (item: LibraryItem) => void;
  onDelete: (item: LibraryItem) => void;
  onSend: (item: LibraryItem) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function LibraryItemCard({ 
  item, 
  onEdit, 
  onDelete, 
  onSend, 
  isExpanded, 
  onToggleExpand 
}: LibraryItemCardProps) {
  const primary = item.title || [item.raaga, item.thala].filter(Boolean).join(" · ") || (item.lyrics?.trim().slice(0, 50)?.trim() || "Untitled") + (item.lyrics && item.lyrics.length > 50 ? "…" : "");
  const secondary = item.title && (item.raaga || item.thala) ? [item.raaga, item.thala].filter(Boolean).join(" · ") : null;

  return (
    <li
      className={`group overflow-hidden rounded-[2rem] border transition-all duration-500 sm:rounded-[2.5rem] ${
        isExpanded 
          ? "border-teal-200 bg-white shadow-2xl shadow-teal-900/10 ring-1 ring-teal-50" 
          : "border-stone-100 bg-white hover:border-stone-200 hover:shadow-xl hover:shadow-stone-200/50"
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-4 sm:gap-4 sm:px-6 sm:py-5">
        <button
          type="button"
          onClick={onToggleExpand}
          className={`flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-xl transition-all duration-300 sm:h-12 sm:w-12 sm:rounded-2xl ${
            isExpanded ? "bg-teal-50 text-teal-600" : "text-stone-300 hover:bg-stone-50 hover:text-stone-500"
          }`}
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <ChevronDown className="size-5 sm:size-6" />
          ) : (
            <ChevronRight className="size-5 sm:size-6" />
          )}
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-5">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-500 sm:h-14 sm:w-14 sm:rounded-2xl ${
            isExpanded ? "bg-teal-600 text-white shadow-lg shadow-teal-900/10" : "bg-teal-50 text-teal-600 group-hover:bg-teal-100"
          }`}>
            <Music className="size-5 sm:size-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-stone-900 sm:text-lg" title={primary}>
              {primary}
            </p>
            {secondary != null && (
              <p className="mt-0.5 truncate text-[9px] font-black uppercase tracking-[0.15em] text-stone-400 sm:text-[10px] sm:tracking-[0.2em]" title={secondary}>
                {secondary}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 rounded-xl bg-teal-50 px-3 text-teal-600 transition-all hover:bg-teal-600 hover:text-white hover:shadow-lg hover:shadow-teal-900/10 active:scale-95 sm:h-11 sm:rounded-2xl sm:px-5"
            onClick={() => onSend(item)}
          >
            <Send className="size-4 sm:mr-2" />
            <span className="hidden text-[10px] font-black uppercase tracking-widest sm:inline">Send</span>
          </Button>
          <div className="hidden shrink-0 items-center gap-1 sm:flex">
            <div className="h-6 w-px bg-stone-100 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-full p-0 text-stone-200 hover:bg-stone-50 hover:text-stone-400 transition-colors"
              onClick={() => onEdit(item)}
              title="Edit"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-full p-0 text-stone-100 hover:bg-red-50 hover:text-red-400 transition-colors"
              onClick={() => onDelete(item)}
              title="Delete"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-stone-100 bg-stone-50/30 p-4 sm:p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between sm:hidden">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Actions</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl border-stone-200 bg-white px-4 text-[10px] font-bold uppercase tracking-widest text-stone-600 transition-all hover:bg-stone-50"
                  onClick={() => onEdit(item)}
                >
                  <Pencil className="mr-2 size-3.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl border-red-100 bg-white px-4 text-[10px] font-bold uppercase tracking-widest text-red-500 transition-all hover:bg-red-50 hover:border-red-200"
                  onClick={() => onDelete(item)}
                >
                  <Trash2 className="mr-2 size-3.5" />
                  Delete
                </Button>
              </div>
            </div>

            {item.lyrics?.trim() && (
              <section className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50/50 px-4 py-2.5">
                  <FileText className="size-3.5 text-teal-600" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Lyrics</p>
                </div>
                <div className="max-h-60 overflow-auto px-6 py-6 font-serif text-base leading-relaxed text-stone-700">
                  {item.lyrics}
                </div>
              </section>
            )}

            {item.lyrics_image_paths?.length ? (
              <section className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50/50 px-4 py-2.5">
                  <Plus className="size-3.5 text-teal-600 rotate-45" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Sheet Music / Images</p>
                </div>
                <div className="p-4">
                  <LibraryLyricsImages itemId={item.id} />
                </div>
              </section>
            ) : null}

            {item.audio_path?.trim() && (
              <section className="overflow-visible rounded-2xl border border-stone-100 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50/50 px-4 py-2.5">
                  <Music className="size-3.5 text-teal-600" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Audio Recording</p>
                </div>
                <div className="p-4 sm:p-6">
                  <LibraryAudioPlayer itemId={item.id} />
                </div>
              </section>
            )}
          </div>

          <div className="mt-8 flex justify-end border-t border-stone-100 pt-6">
            <Button
              size="sm"
              className="h-11 rounded-2xl bg-teal-600 px-6 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-teal-900/10 transition-all hover:bg-teal-700 active:scale-95 gap-2"
              onClick={() => onSend(item)}
            >
              <Send className="size-4" />
              Send to student(s)
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
