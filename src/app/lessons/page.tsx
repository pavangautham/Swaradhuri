import { redirect } from "next/navigation";
import { Music2 } from "lucide-react";
import { getCurrentUser, isStudentRemoved } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { StudentLessonsView } from "@/components/student-lessons-view";

const UNCATEGORIZED = "Uncategorized";

export default async function LessonsPage() {
  const user = await getCurrentUser();
  if (!user?.userId) redirect("/sign-in");
  if (user.role !== "student") redirect("/");
  if (await isStudentRemoved(user.userId)) redirect("/removed");

  const supabase = createServerSupabaseClient();
  const { data: lessons, error } = await supabase
    .from("lessons")
    .select("id, lyrics, title, raaga, thala, category, created_at")
    .eq("student_id", user.userId)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-red-600">Failed to load lessons.</p>
      </div>
    );
  }

  const byCategory = new Map<string, { id: string; lyrics: string; title?: string | null; raaga?: string | null; thala?: string | null; created_at: string }[]>();
  for (const l of lessons ?? []) {
    const cat = l.category?.trim() || UNCATEGORIZED;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push({
      id: l.id,
      lyrics: l.lyrics,
      title: l.title,
      raaga: l.raaga,
      thala: l.thala,
      created_at: l.created_at,
    });
  }

  const sortedCategories = Array.from(byCategory.keys()).sort((a, b) => {
    if (a === UNCATEGORIZED) return 1;
    if (b === UNCATEGORIZED) return -1;
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  });

  const groups = sortedCategories.map((category) => ({
    category,
    lessons: byCategory.get(category)!,
  }));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-amber-50/40 via-stone-50 to-teal-50/30">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="mb-10 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 shadow-sm shadow-teal-900/5">
            <Music2 className="size-7" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              My Lessons
            </h1>
            <p className="mt-1 text-base font-medium text-stone-500">
              Your repertoire by category
            </p>
          </div>
        </div>

        <StudentLessonsView groups={groups} />
      </div>
    </div>
  );
}
