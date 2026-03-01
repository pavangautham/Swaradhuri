import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { getCurrentUser, isStudentRemoved } from "@/lib/auth";

export default async function InstructionsPage() {
  const user = await getCurrentUser();
  if (!user?.userId) redirect("/sign-in");
  if (user.role !== "student") redirect("/");
  if (await isStudentRemoved(user.userId)) redirect("/removed");

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-amber-50/40 via-stone-50 to-teal-50/30">
      <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
            <BookOpen className="size-6" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">
              Instructions
            </h1>
            <p className="mt-0.5 text-stone-600">
              Information about your Carnatic music lessons
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-stone-200/80 bg-white/90 shadow-md shadow-stone-200/50 ring-1 ring-stone-200/50">
          <div className="border-b border-stone-100 bg-stone-50/50 px-6 py-4">
            <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-stone-900">
              <BookOpen className="size-5 text-teal-600" />
              Guide
            </h2>
          </div>
          <div className="space-y-6 p-6">
            <section>
              <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-stone-400">
                About Your Lessons
              </h3>
              <div className="space-y-4 text-sm text-stone-700 leading-relaxed">
                <p>
                  Welcome to your personalized student portal. Here, your teacher will share audio recordings, lyrics, and sheet music tailored specifically for your progress.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-stone-600 marker:text-teal-500">
                  <li><strong>Lessons tab:</strong> Find all your repertoire organized by category (e.g., Varnas, Krithis).</li>
                  <li><strong>Audio Player:</strong> Use the built-in player to listen to your teacher's recordings. You can adjust the playback speed to practice at your own pace.</li>
                  <li><strong>Lyrics & Notation:</strong> View the provided text and images to follow along during your practice sessions.</li>
                </ul>
              </div>
            </section>

            <section className="border-t border-stone-100 pt-6">
              <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-stone-400">
                Practice Guidelines
              </h3>
              <div className="space-y-4 text-sm text-stone-700 leading-relaxed">
                <p>
                  Consistent, mindful practice is the key to mastering Carnatic music.
                </p>
                <ul className="list-decimal pl-5 space-y-2 text-stone-600 marker:text-amber-500">
                  <li><strong>Warm-up:</strong> Always start your session with Shruti alignment (using a Tambura) and basic vocal exercises like Sarali Varisais.</li>
                  <li><strong>Listen First:</strong> Before attempting to sing or play a new lesson, listen to the teacher's recording multiple times to internalize the melody, gamakas, and thala.</li>
                  <li><strong>Break it Down:</strong> Practice phrase by phrase. Don't rush to complete the whole song. Focus on accuracy over speed.</li>
                  <li><strong>Thala Practice:</strong> Always keep the thala (rhythm) with your hands while practicing to ensure perfect timing.</li>
                </ul>
              </div>
            </section>

            <section className="border-t border-stone-100 pt-6">
              <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-stone-400">
                Need Help?
              </h3>
              <p className="text-sm text-stone-700 leading-relaxed">
                If you have questions about a specific lesson, a difficult gamaka, or need technical help with the app, please reach out directly to your teacher during your next live class or via your usual communication channels.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
