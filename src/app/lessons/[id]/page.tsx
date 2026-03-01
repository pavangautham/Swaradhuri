import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Music2, ArrowLeft } from "lucide-react";
import { getCurrentUser, isStudentRemoved } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LessonPlayer } from "./lesson-player";
import { LyricsImages } from "./lyrics-images";
import { Button } from "@/components/ui/button";

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user?.userId) redirect("/sign-in");
  if (user.role !== "student") redirect("/");
  if (await isStudentRemoved(user.userId)) redirect("/removed");

  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select("id, lyrics, title, raaga, thala, lyrics_image_paths")
    .eq("id", id)
    .eq("student_id", user.userId)
    .single();

  if (error || !lesson) notFound();

  const raagaThala = [lesson.raaga, lesson.thala].filter(Boolean).join(" · ");
  const hasImages = ((lesson.lyrics_image_paths as string[] | null)?.length ?? 0) > 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-amber-50/40 via-stone-50 to-teal-50/30">
      <div className="mx-auto max-w-3xl space-y-10 px-4 py-12">
        <div className="flex items-start gap-5">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-12 w-12 shrink-0 rounded-2xl border border-stone-100 bg-white text-stone-400 shadow-sm transition-all hover:bg-stone-50 hover:text-stone-900 active:scale-95"
          >
            <Link href="/lessons">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              {lesson.title || "Untitled Lesson"}
            </h1>
            {raagaThala && (
              <div className="mt-3 flex">
                <span className="rounded-full bg-teal-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-md shadow-teal-900/10">
                  {raagaThala}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {lesson.lyrics?.trim() && (
            <section className="overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-xl shadow-stone-200/50">
              <div className="flex items-center gap-3 border-b border-stone-50 bg-stone-50/50 px-6 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  <Music2 className="size-4" />
                </div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-500">Lyrics</h2>
              </div>
              <div className="px-8 py-8">
                <pre className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-stone-700">
                  {lesson.lyrics}
                </pre>
              </div>
            </section>
          )}

          {hasImages && (
            <section className="overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-xl shadow-stone-200/50">
              <div className="flex items-center gap-3 border-b border-stone-50 bg-stone-50/50 px-6 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  <ArrowLeft className="size-4 rotate-90" />
                </div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-500">Sheet Music / Images</h2>
              </div>
              <div className="p-2 sm:p-4">
                <LyricsImages lessonId={lesson.id} />
              </div>
            </section>
          )}

          <section className="overflow-visible rounded-3xl border border-stone-100 bg-white p-1 shadow-xl shadow-stone-200/50">
            <div className="rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-teal-50/50 to-white px-6 py-8 sm:px-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white shadow-lg shadow-teal-900/10">
                  <Music2 className="size-4" />
                </div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-500">Audio Recording</h2>
              </div>
              <LessonPlayer lessonId={lesson.id} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
