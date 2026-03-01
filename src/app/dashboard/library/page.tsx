"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { LessonLibrary } from "@/components/lesson-library";

export default function LibraryPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const isTeacher =
    (user?.publicMetadata as { role?: string })?.role === "teacher" ||
    (user?.publicMetadata as { role?: string })?.role === "teacher_admin";

  useEffect(() => {
    if (isLoaded && !isTeacher) {
      router.replace("/");
    }
  }, [isLoaded, isTeacher, router]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-amber-50/40 via-stone-50 to-teal-50/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-teal-600" />
          <p className="text-sm text-stone-600">Loading…</p>
        </div>
      </div>
    );
  }
  if (!isTeacher) return null;

  return <LessonLibrary variant="page" />;
}
