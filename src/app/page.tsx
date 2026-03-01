import { redirect } from "next/navigation";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { getCurrentUser, isStudentRemoved } from "@/lib/auth";
import { processPendingInvite } from "@/lib/process-pending-invite";
import { Button } from "@/components/ui/button";
import { Music, ArrowRight, BookOpen, Users } from "lucide-react";

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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-stone-50 px-6 py-12 sm:px-12">
      {/* Background Gradients - More expansive on desktop */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] h-[60%] w-[70%] rounded-full bg-teal-100/30 blur-[120px] lg:h-[80%] lg:w-[60%]" />
        <div className="absolute top-[10%] -right-[10%] h-[60%] w-[60%] rounded-full bg-amber-100/20 blur-[100px] lg:h-[70%] lg:w-[50%]" />
      </div>

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-12 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000 lg:gap-16">
        
        <div className="space-y-6 lg:space-y-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-2xl shadow-teal-900/10 ring-1 ring-white/20 sm:h-16 sm:w-16 sm:rounded-[1.5rem]">
            <Music className="size-7 sm:size-8" />
          </div>
          <h1 className="mx-auto max-w-3xl font-serif text-4xl font-bold tracking-tight text-stone-900 sm:text-6xl lg:text-7xl lg:tracking-tighter">
            Sumadhwa Swaradhuri
          </h1>
          <p className="mx-auto max-w-[280px] text-sm font-medium leading-relaxed text-stone-600 sm:max-w-md sm:text-lg lg:text-xl">
            A dedicated space to learn, practice, and master Carnatic music under your Guru&apos;s guidance.
          </p>
        </div>

        <SignedOut>
          <div className="flex w-full flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
            <SignUpButton mode="modal">
              <Button className="group h-12 w-full bg-teal-600 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-teal-900/10 transition-all hover:bg-teal-700 active:scale-95 sm:h-14 sm:w-[200px] sm:text-xs">
                Start Learning
                <ArrowRight className="ml-2 size-3.5 transition-transform group-hover:translate-x-1" />
              </Button>
            </SignUpButton>
            <SignInButton mode="modal">
              <Button variant="outline" className="h-12 w-full rounded-2xl border-stone-200 bg-white/80 text-[11px] font-black uppercase tracking-widest text-stone-500 backdrop-blur-md transition-all hover:bg-stone-50 hover:text-stone-900 sm:h-14 sm:w-[160px] sm:text-xs">
                Log In
              </Button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-teal-50/50 px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-teal-800 shadow-sm backdrop-blur-md sm:px-8 sm:py-4 sm:text-xs">
            <div className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            Welcome back. Access your personalized lessons below.
          </div>
        </SignedIn>

        {/* Feature Highlights - 3 columns on desktop */}
        <div className="mt-8 grid grid-cols-1 gap-8 text-left border-t border-stone-200/40 pt-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          <div className="flex flex-col gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Music className="size-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-stone-800">Clear Audio</h3>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-stone-500 sm:text-xs">High-fidelity recordings from your Guru for precise shruti and laya practice.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <BookOpen className="size-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-stone-800">Direct Lessons</h3>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-stone-500 sm:text-xs">Receive Varnas, Krithis, and lyrics images directly to your personal portal.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
              <Users className="size-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-stone-800">Guru Guided</h3>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-stone-500 sm:text-xs">Follow a structured path designed by your teacher for your unique progress.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
