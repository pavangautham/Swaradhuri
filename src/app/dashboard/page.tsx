"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { 
  Loader2, 
  RefreshCw, 
  LayoutDashboard, 
  UserCheck, 
  Music, 
  Send, 
  PlusCircle, 
  Users, 
  ChevronRight,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { Student, Lesson } from "@/types/music";

type PendingApproval = {
  id: string;
  studentId: string;
  email: string | null;
  fullName: string | null;
  createdAt: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [loadingApprovals, setLoadingApprovals] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  const fetchData = useCallback(async () => {
    setLoadingApprovals(true);
    setLoadingRecent(true);
    try {
      const [approvalsRes, lessonsRes, studentsRes] = await Promise.all([
        fetch("/api/pending-approvals", { cache: "no-store" }),
        fetch("/api/lessons", { cache: "no-store" }), // This fetches all lessons for teacher
        fetch("/api/students", { cache: "no-store" })
      ]);

      if (approvalsRes.ok) setPendingApprovals(await approvalsRes.json());
      if (lessonsRes.ok) {
        const lessons = await lessonsRes.json();
        setRecentLessons(lessons.slice(0, 5));
      }
      if (studentsRes.ok) setStudents(await studentsRes.json());
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoadingApprovals(false);
      setLoadingRecent(false);
    }
  }, []);

  const approveStudent = useCallback(async (id: string) => {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/pending-approvals/${id}`, { method: "POST" });
      if (res.ok) {
        toast.success("Student approved");
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Failed to approve");
      }
    } catch {
      toast.error("Failed to approve");
    } finally {
      setApprovingId(null);
    }
  }, [fetchData]);

  const isTeacher = (user?.publicMetadata as { role?: string })?.role === "teacher" ||
    (user?.publicMetadata as { role?: string })?.role === "teacher_admin";

  useEffect(() => {
    if (isLoaded && !isTeacher) {
      router.replace("/");
      return;
    }
  }, [isLoaded, isTeacher, router]);

  useEffect(() => {
    if (isTeacher) {
      fetchData();
    }
  }, [user, isTeacher, fetchData]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-stone-50">
        <Loader2 className="size-10 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!isTeacher) return null;

  const quickActions = [
    {
      title: "Send Lesson",
      desc: "Pick from library",
      icon: Send,
      href: "/dashboard/library",
      color: "bg-teal-600",
      lightColor: "bg-teal-50",
      textColor: "text-teal-700"
    },
    {
      title: "Add Repertoire",
      desc: "Build your library",
      icon: PlusCircle,
      href: "/dashboard/library",
      color: "bg-amber-500",
      lightColor: "bg-amber-50",
      textColor: "text-amber-700"
    },
    {
      title: "My Students",
      desc: "Manage progress",
      icon: Users,
      href: "/dashboard/students",
      color: "bg-stone-800",
      lightColor: "bg-stone-100",
      textColor: "text-stone-700"
    }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-amber-50/40 via-stone-50 to-teal-50/30 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/50">
              <LayoutDashboard className="size-6 text-stone-800" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                Namaste, {user?.firstName || "Teacher"}
              </h1>
              <p className="text-sm font-medium text-stone-500">Here&apos;s what&apos;s happening today.</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchData} className="h-10 w-10 rounded-full p-0 text-stone-400">
            <RefreshCw className={`size-4 ${loadingApprovals ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Approvals - Only show if there are any */}
        {pendingApprovals.length > 0 && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="mb-4 flex items-center gap-2 px-1">
              <UserCheck className="size-4 text-amber-500" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Action Required</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {pendingApprovals.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-4 rounded-3xl border border-amber-100 bg-amber-50/30 p-4 shadow-sm backdrop-blur-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-stone-800">{p.fullName || p.email}</p>
                    <p className="text-[10px] font-medium text-amber-600/80 uppercase tracking-wider">New Student Sign-up</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => approveStudent(p.id)}
                    disabled={approvingId === p.id}
                    className="h-9 rounded-xl bg-amber-500 px-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-amber-600 shadow-md shadow-amber-200"
                  >
                    {approvingId === p.id ? "..." : "Approve"}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section>
          <div className="mb-4 flex items-center gap-2 px-1">
            <Clock className="size-4 text-stone-400" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Quick Actions</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} href={action.href} className="group">
                  <div className="flex h-full flex-col gap-4 rounded-[2rem] border border-stone-100 bg-white p-6 shadow-xl shadow-stone-200/40 transition-all group-hover:-translate-y-1 group-hover:shadow-2xl group-active:scale-[0.98]">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${action.color} text-white shadow-lg`}>
                      <Icon className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-stone-900">{action.title}</h3>
                      <p className="text-sm font-medium text-stone-500">{action.desc}</p>
                    </div>
                    <div className={`mt-auto flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${action.textColor}`}>
                      Go to {action.title.split(' ')[1] || 'Page'} <ChevronRight className="size-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <div className="mb-4 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Music className="size-4 text-teal-500" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Recent Lessons Sent</h2>
            </div>
            <Link href="/dashboard/students" className="text-[10px] font-black uppercase tracking-widest text-teal-600 hover:text-teal-700">View All</Link>
          </div>
          
          <div className="overflow-hidden rounded-[2.5rem] border border-stone-100 bg-white shadow-xl shadow-stone-200/40">
            {loadingRecent ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-stone-200" />
              </div>
            ) : recentLessons.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <p className="text-sm font-bold text-stone-400 italic">No lessons sent yet.</p>
                <Button asChild variant="link" className="mt-2 text-teal-600">
                  <Link href="/dashboard/library">Visit Library to send your first lesson</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-stone-50">
                {recentLessons.map((lesson) => {
                  const student = students.find(s => s.id === lesson.student_id);
                  return (
                    <Link key={lesson.id} href={`/dashboard/students?student=${lesson.student_id}`} className="group block px-6 py-5 transition-colors hover:bg-stone-50/50">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-base font-bold text-stone-800">
                              {lesson.title || "Untitled Lesson"}
                            </span>
                            {lesson.category && (
                              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[9px] font-bold text-teal-600 uppercase tracking-wider">
                                {lesson.category}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-xs font-medium text-stone-400">
                            Sent to <span className="text-stone-600 font-bold">{student?.fullName || student?.email || "Student"}</span>
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-[10px] font-bold text-stone-300">
                            {new Date(lesson.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-50 text-stone-300 transition-all group-hover:bg-teal-600 group-hover:text-white">
                            <ChevronRight className="size-4" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
