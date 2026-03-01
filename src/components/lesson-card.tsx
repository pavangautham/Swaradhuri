import Link from "next/link";
import { ChevronRight, Music2, Calendar } from "lucide-react";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type Lesson = {
  id: string;
  lyrics: string;
  title?: string | null;
  raaga?: string | null;
  thala?: string | null;
  created_at: string;
};

export function LessonCard({ lesson }: { lesson: Lesson }) {
  const meta = [lesson.title, lesson.raaga, lesson.thala].filter(Boolean);
  const titleLine = meta.join(" · ") || "Untitled Lesson";

  return (
    <Link
      href={`/lessons/${lesson.id}`}
      className="group block overflow-hidden rounded-[2rem] border border-stone-100 bg-white transition-all duration-300 hover:border-teal-200 hover:shadow-2xl hover:shadow-teal-900/5 active:scale-[0.98]"
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <div className="flex items-center gap-4 sm:contents">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 transition-all duration-500 group-hover:bg-teal-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-teal-900/10 sm:h-16 sm:w-16">
            <Music2 className="size-7 transition-transform duration-500 group-hover:scale-110 sm:size-8" />
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-stone-400">
              <Calendar className="size-3" />
              {formatDate(lesson.created_at)}
            </div>
            <h3 className="mt-1 truncate text-lg font-bold text-stone-900 transition-colors group-hover:text-teal-700 sm:text-xl">
              {titleLine}
            </h3>
            {lesson.lyrics && (
              <p className="mt-1 line-clamp-1 text-sm font-medium text-stone-500/80">
                {lesson.lyrics}
              </p>
            )}
          </div>
        </div>

        <div className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-stone-50 px-5 text-xs font-black uppercase tracking-widest text-stone-600 transition-all group-hover:bg-teal-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-teal-900/10 sm:w-auto">
          <span>Explore Lesson</span>
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
