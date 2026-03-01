import { redirect } from "next/navigation";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { getCurrentUser, isStudentRemoved } from "@/lib/auth";
import { processPendingInvite } from "@/lib/process-pending-invite";
import { Button } from "@/components/ui/button";
import { Music, ArrowRight, BookOpen } from "lucide-react";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user?.userId) {
    if (user.role === "teacher" || user.role === "teacher_admin") redirect("/dashboard");
    if (user.role === "student") {
      if (await isStudentRemoved(user.userId)) redirect("/removed");
      redirect("/lessons");
    }
    if (user.role === "pending_student") {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 bg-[url('/noise.svg')] bg-repeat">
          <div className="flex w-full max-w-md flex-col items-center gap-8 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-xl shadow-teal-900/20">
              <Music className="size-8" />
            </div>
            <h1 className="font-serif text-5xl font-bold tracking-tight text-stone-900">
              Sumadhwa Swaradhuri
            </h1>
            <div className="w-full rounded-[2rem] border border-amber-200/60 bg-amber-50/50 p-8 shadow-xl shadow-amber-900/5 backdrop-blur-sm">
              <h2 className="text-sm font-black uppercase tracking-widest text-amber-800">Pending Approval</h2>
              <p className="mt-4 text-base font-medium text-amber-900/80 leading-relaxed">
                Your teacher has been notified of your sign-up. Please wait for them to approve your access to the lesson portal.
              </p>
            </div>
          </div>
        </div>
      );
    }
    if (!user.role) {
      const processed = await processPendingInvite(user.userId);
      if (processed) {
        if (processed === "pending_student") redirect("/");
        redirect(processed === "student" ? "/lessons" : "/dashboard");
      }
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-stone-50 px-4">
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] h-[70%] w-[50%] rounded-full bg-teal-100/40 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[60%] w-[40%] rounded-full bg-amber-100/40 blur-[100px]" />
      </div>

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-10 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        <div className="space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-600 text-white shadow-2xl shadow-teal-900/20 ring-1 ring-white/20">
            <Music className="size-10" />
          </div>
          <h1 className="font-serif text-6xl font-bold tracking-tighter text-stone-900 sm:text-7xl">
            Sumadhwa Swaradhuri
          </h1>
          <p className="mx-auto max-w-sm text-lg font-medium text-stone-600 leading-relaxed sm:text-xl">
            The elegant way to teach, learn, and practice Carnatic music.
          </p>
        </div>

        <SignedOut>
          <div className="flex w-full flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <SignInButton mode="modal">
              <Button variant="outline" className="h-14 w-full sm:w-[160px] rounded-2xl border-stone-200 bg-white/80 text-sm font-black uppercase tracking-widest text-stone-600 backdrop-blur-md transition-all hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300">
                Log In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button className="group h-14 w-full sm:w-[200px] rounded-2xl bg-teal-600 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-teal-900/20 transition-all hover:bg-teal-700 active:scale-95">
                Start Learning
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </SignUpButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-teal-50/50 px-6 py-4 text-sm font-medium text-teal-800 shadow-sm backdrop-blur-md">
            <div className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            Sign up complete. Your teacher will approve your access soon.
          </div>
        </SignedIn>

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-2 gap-4 text-left border-t border-stone-200/60 pt-10">
          <div className="flex flex-col gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100/50 text-teal-700">
              <Music className="size-4" />
            </div>
            <h3 className="text-sm font-bold text-stone-800">Clear Audio</h3>
            <p className="text-xs font-medium text-stone-500">Listen to high-quality recordings directly from your teacher.</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100/50 text-amber-700">
              <BookOpen className="size-4" />
            </div>
            <h3 className="text-sm font-bold text-stone-800">Organized Library</h3>
            <p className="text-xs font-medium text-stone-500">All your Varnas and Krithis neatly organized in one place.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
