"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Archive, ChevronDown, ChevronRight, FileImage, FileText, Loader2, Music2, Pencil, RefreshCw, Search, Trash2, UserMinus, UserPlus, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LessonPlayer } from "@/app/lessons/[id]/lesson-player";
import { LyricsImages } from "@/app/lessons/[id]/lyrics-images";
import { lessonMatchesSearch } from "@/lib/lesson-search";
import { LessonForm } from "@/components/forms/LessonForm";
import { Lesson, Student, Category } from "@/types/music";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PastStudent = { id: string; email: string | null; fullName: string | null; removedAt: string | null };

export default function StudentsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-stone-50">
        <Loader2 className="size-10 animate-spin text-teal-600" />
      </div>
    }>
      <StudentListContent />
    </Suspense>
  );
}

function StudentListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [pastStudents, setPastStudents] = useState<PastStudent[]>([]);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [lessonsByStudent, setLessonsByStudent] = useState<Record<string, Lesson[]>>({});
  const [loadingLessons, setLoadingLessons] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [copyingTo, setCopyingTo] = useState<{ lessonId: string; studentId: string } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; displayName: string } | null>(null);
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<{ lessonId: string; studentId: string; title?: string } | null>(null);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);
  const [lessonCategoryFilter, setLessonCategoryFilter] = useState<string>("");
  const [lessonSearchQuery, setLessonSearchQuery] = useState("");
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);

  const fetchStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const res = await fetch("/api/students", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch {
      toast.error("Failed to load students");
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  const fetchPastStudents = useCallback(async () => {
    try {
      const res = await fetch("/api/students/removed", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setPastStudents(data);
      }
    } catch {
      toast.error("Failed to load past students");
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/library/categories", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAvailableCategories(data);
      }
    } catch {
      // ignore
    }
  }, []);

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
      fetchStudents();
      fetchPastStudents();
      fetchCategories();
    }
  }, [user, isTeacher, fetchStudents, fetchPastStudents, fetchCategories]);

  const addStudentBack = useCallback(async (studentId: string) => {
    setRestoringId(studentId);
    try {
      const res = await fetch(`/api/students/removed/${encodeURIComponent(studentId)}/restore`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Student added back");
        await Promise.all([fetchStudents(), fetchPastStudents()]);
      } else {
        toast.error(data?.error ?? "Failed to add student back");
      }
    } catch {
      toast.error("Failed to add student back");
    } finally {
      setRestoringId(null);
    }
  }, [fetchStudents, fetchPastStudents]);

  const openRemoveDialog = useCallback((studentId: string, displayName: string) => {
    setRemoveTarget({ id: studentId, displayName });
  }, []);

  const closeRemoveDialog = useCallback(() => {
    setRemoveTarget(null);
  }, []);

  const confirmRemoveStudent = useCallback(async () => {
    if (!removeTarget) return;
    const { id: studentId } = removeTarget;
    setRemovingId(studentId);
    try {
      const res = await fetch(`/api/students/${encodeURIComponent(studentId)}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Student removed");
        closeRemoveDialog();
        await Promise.all([fetchStudents(), fetchPastStudents()]);
        setLessonsByStudent((prev) => {
          const next = { ...prev };
          delete next[studentId];
          return next;
        });
        if (expandedStudent === studentId) setExpandedStudent(null);
      } else {
        const data = await res.json();
        toast.error(data?.error ?? "Failed to remove student");
      }
    } catch {
      toast.error("Failed to remove student");
    } finally {
      setRemovingId(null);
    }
  }, [removeTarget, fetchStudents, fetchPastStudents, expandedStudent, closeRemoveDialog]);

  const fetchLessonsForStudent = useCallback(async (studentId: string) => {
    setLoadingLessons(studentId);
    try {
      const res = await fetch(`/api/lessons?student_id=${encodeURIComponent(studentId)}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setLessonsByStudent((prev) => ({ ...prev, [studentId]: data }));
      }
    } catch {
      toast.error("Failed to load lessons");
    } finally {
      setLoadingLessons(null);
    }
  }, []);

  const handleUpdateLesson = useCallback(async (formData: FormData) => {
    if (!editingLessonId) return;
    const studentId = Object.keys(lessonsByStudent).find((sid) =>
      lessonsByStudent[sid]?.some((l) => l.id === editingLessonId)
    );
    
    try {
      const res = await fetch(`/api/lessons/${editingLessonId}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to update lesson");
      }
      toast.success("Lesson updated");
      setEditingLessonId(null);
      if (studentId) fetchLessonsForStudent(studentId);
      fetchCategories();
    } catch (err) {
      throw err;
    }
  }, [editingLessonId, lessonsByStudent, fetchLessonsForStudent, fetchCategories]);

  const copyLessonToStudent = useCallback(
    async (lessonId: string, targetStudentId: string) => {
      setCopyingTo({ lessonId, studentId: targetStudentId });
      try {
        const res = await fetch(`/api/lessons/${lessonId}/copy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_student_id: targetStudentId }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success("Lesson added to student");
          fetchLessonsForStudent(targetStudentId);
        } else {
          toast.error(data?.error ?? "Failed to add lesson");
        }
      } catch {
        toast.error("Failed to add lesson");
      } finally {
        setCopyingTo(null);
      }
    },
    [fetchLessonsForStudent]
  );

  const confirmDeleteLesson = useCallback(async () => {
    if (!deleteLessonTarget) return;
    setDeletingLessonId(deleteLessonTarget.lessonId);
    try {
      const res = await fetch(`/api/lessons/${deleteLessonTarget.lessonId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Lesson removed");
        setDeleteLessonTarget(null);
        fetchLessonsForStudent(deleteLessonTarget.studentId);
      } else {
        const data = await res.json();
        toast.error(data?.error ?? "Failed to delete lesson");
      }
    } catch {
      toast.error("Failed to delete lesson");
    } finally {
      setDeletingLessonId(null);
    }
  }, [deleteLessonTarget, fetchLessonsForStudent]);

  const toggleStudent = useCallback(
    (studentId: string) => {
      setExpandedStudent((prev) => {
        const next = prev === studentId ? null : studentId;
        if (next && !lessonsByStudent[next]) fetchLessonsForStudent(next);
        return next;
      });
      setLessonCategoryFilter("");
      setLessonSearchQuery("");
    },
    [fetchLessonsForStudent, lessonsByStudent]
  );

  // Handle URL parameter for student expansion
  useEffect(() => {
    const studentIdFromUrl = searchParams.get("student");
    if (studentIdFromUrl && !loadingStudents && students.length > 0) {
      const exists = students.some(s => s.id === studentIdFromUrl);
      if (exists) {
        setExpandedStudent(studentIdFromUrl);
        if (!lessonsByStudent[studentIdFromUrl]) {
          fetchLessonsForStudent(studentIdFromUrl);
        }
        // Optional: Scroll to the element after a small delay
        setTimeout(() => {
          const el = document.getElementById(`student-${studentIdFromUrl}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [searchParams, loadingStudents, students, lessonsByStudent, fetchLessonsForStudent]);

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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-amber-50/40 via-stone-50 to-teal-50/30">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 shadow-sm shadow-teal-900/5">
              <Users className="size-6" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                My Students
              </h1>
              <p className="mt-0.5 text-sm font-medium text-stone-500">
                Manage your students and the lessons you&apos;ve sent to them
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { fetchStudents(); fetchPastStudents(); fetchCategories(); }}
            disabled={loadingStudents}
            className="h-10 border-stone-200 bg-white px-4 text-xs font-bold uppercase tracking-widest text-stone-600 transition-all hover:bg-stone-50 hover:text-stone-900 sm:w-auto"
          >
            {loadingStudents ? (
              <Loader2 className="mr-2 size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 size-3.5" />
            )}
            Refresh
          </Button>
        </div>

        <div className="space-y-4">
          {loadingStudents ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="size-10 animate-spin text-teal-600/20" />
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-stone-200 bg-white/50 py-20 px-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-stone-100">
                <Users className="size-10 text-teal-500/30" />
              </div>
              <p className="mt-6 text-lg font-bold text-stone-800">No students yet</p>
              <p className="mt-2 text-sm text-stone-500">Create a lesson from the dashboard to add your first student.</p>
            </div>
          ) : (
            <ul className="grid gap-4">
              {students.map((s) => {
                const isExpanded = expandedStudent === s.id;
                const lessons = lessonsByStudent[s.id];
                const loading = loadingLessons === s.id;
                const displayName = s.fullName || s.email || s.id;
                return (
                  <li key={s.id} id={`student-${s.id}`} className={`overflow-hidden rounded-[2rem] border transition-all duration-500 ${
                    isExpanded 
                      ? "border-teal-200 bg-white shadow-2xl shadow-teal-900/10 ring-1 ring-teal-50" 
                      : "border-stone-200/60 bg-white/80 hover:border-teal-200/50 hover:bg-white hover:shadow-xl hover:shadow-stone-200/30"
                  }`}>
                    <div className="flex items-center gap-3 p-3 sm:p-4">
                      <button
                        type="button"
                        onClick={() => toggleStudent(s.id)}
                        className={`flex h-14 flex-1 items-center gap-4 rounded-2xl px-3 text-left transition-all ${
                          isExpanded ? "bg-teal-50/40" : "hover:bg-stone-50"
                        }`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                          isExpanded ? "bg-teal-600 text-white shadow-lg shadow-teal-900/20" : "bg-stone-100 text-stone-400"
                        }`}>
                          {isExpanded ? <ChevronDown className="size-5" /> : <ChevronRight className="size-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-lg font-bold tracking-tight text-stone-800">{displayName}</span>
                          {s.fullName && s.email && <span className="block truncate text-xs font-medium text-stone-400/80">{s.email}</span>}
                        </div>
                      </button>
                      <div className="flex items-center gap-1 pr-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); openRemoveDialog(s.id, displayName); }}
                          disabled={removingId === s.id}
                          className="h-10 w-10 rounded-xl text-stone-300 transition-all hover:bg-red-50 hover:text-red-500 active:scale-90"
                          title="Remove student"
                        >
                          {removingId === s.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <UserMinus className="size-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-stone-100 bg-gradient-to-b from-stone-50/50 to-white p-4 sm:p-8">
                        {loading ? (
                          <div className="flex flex-col items-center justify-center gap-3 py-20">
                            <div className="relative flex h-12 w-12 items-center justify-center">
                              <Loader2 className="absolute size-10 animate-spin text-teal-600/20" />
                              <Music2 className="size-5 text-teal-600" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Fetching lessons...</p>
                          </div>
                        ) : !lessons || lessons.length === 0 ? (
                          <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-stone-100 bg-white/50 py-20 px-6 text-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-stone-50">
                              <FileText className="size-10 text-teal-500/20" />
                            </div>
                            <p className="mt-6 text-base font-bold text-stone-800">No lessons sent yet</p>
                            <p className="mt-2 text-sm text-stone-500">Lessons you send to this student will appear here.</p>
                          </div>
                        ) : (
                          <>
                            {(() => {
                              const normalized = (l: Lesson) => (l.category?.trim() || "Uncategorized");
                              const categories = [...new Set(lessons.map(normalized))].sort((a, b) => (a === "Uncategorized" ? 1 : b === "Uncategorized" ? -1 : a.localeCompare(b)));
                              const byCategory = !lessonCategoryFilter || lessonCategoryFilter === "All"
                                ? lessons
                                : lessons.filter((l) => normalized(l) === lessonCategoryFilter);
                              const filtered = byCategory.filter((l) => lessonMatchesSearch(l, lessonSearchQuery, { includeCategory: true }));
                              return (
                                <div className="space-y-8">
                                  <div className="space-y-6">
                                    <div className="px-1">
                                      <div className="flex flex-wrap items-center gap-2.5">
                                        <button
                                          onClick={() => setLessonCategoryFilter("")}
                                          className={`h-9 rounded-full px-4 text-[10px] font-semibold uppercase tracking-wider transition-all sm:h-8 sm:px-5 sm:text-xs flex items-center gap-2 ${
                                            (!lessonCategoryFilter || lessonCategoryFilter === "All") 
                                              ? "bg-teal-600 shadow-md shadow-teal-900/10 text-white hover:bg-teal-700" 
                                              : "border border-stone-200 bg-white text-stone-600 hover:border-teal-200 hover:bg-teal-50/50 hover:text-teal-700"
                                          }`}
                                        >
                                          All
                                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                                            (!lessonCategoryFilter || lessonCategoryFilter === "All") ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
                                          }`}>
                                            {lessons.length}
                                          </span>
                                        </button>
                                        {categories.map((cat) => {
                                          const count = lessons.filter(l => normalized(l) === cat).length;
                                          return (
                                            <button
                                              key={cat}
                                              onClick={() => setLessonCategoryFilter(cat)}
                                              className={`h-9 rounded-full px-4 text-[10px] font-semibold uppercase tracking-wider transition-all sm:h-8 sm:px-5 sm:text-xs flex items-center gap-2 ${
                                                lessonCategoryFilter === cat 
                                                  ? "bg-teal-600 shadow-md shadow-teal-900/10 text-white hover:bg-teal-700" 
                                                  : "border border-stone-200 bg-white text-stone-600 hover:border-teal-200 hover:bg-teal-50/50 hover:text-teal-700"
                                              }`}
                                            >
                                              {cat}
                                              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                                                lessonCategoryFilter === cat ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
                                              }`}>
                                                {count}
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    <div className="relative">
                                      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-stone-300" />
                                      <Input
                                        type="search"
                                        placeholder={`Search in ${lessonCategoryFilter || "all"} lessons...`}
                                        value={lessonSearchQuery}
                                        onChange={(e) => setLessonSearchQuery(e.target.value)}
                                        className="h-12 border-stone-200 bg-white pl-11 shadow-sm transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10 placeholder:text-stone-400"
                                        aria-label="Search lessons"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-6">
                                    <div className="flex items-center gap-4 px-2">
                                      <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-800">
                                        {lessonCategoryFilter || "All Lessons"}
                                      </h3>
                                      <div className="h-px flex-1 bg-stone-100" />
                                    </div>

                                    <ul className="grid gap-5">
                                      {filtered.map((lesson) => (
                                        <li
                                          key={lesson.id}
                                          className={`group overflow-hidden rounded-[2rem] border transition-all duration-500 sm:rounded-[2.5rem] ${
                                            editingLessonId === lesson.id 
                                              ? "border-amber-200 bg-white shadow-2xl shadow-amber-900/10 ring-1 ring-amber-50" 
                                              : "border-stone-100 bg-white hover:border-stone-200 hover:shadow-xl hover:shadow-stone-200/50"
                                          }`}
                                        >
                                          {editingLessonId === lesson.id ? (
                                            <div className="p-1">
                                              <LessonForm
                                                initialData={lesson}
                                                categories={availableCategories}
                                                onSubmit={handleUpdateLesson}
                                                onCancel={() => setEditingLessonId(null)}
                                                variant="amber"
                                                formTitle="Edit Lesson"
                                                submitLabel="Save Changes"
                                              />
                                            </div>
                                          ) : (
                                            <>
                                              <div className="flex items-center gap-2 px-3 py-4 sm:gap-4 sm:px-6 sm:py-5">
                                                <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-5">
                                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-all duration-500 group-hover:bg-teal-100 sm:h-14 sm:w-14 sm:rounded-2xl">
                                                    <Music2 className="size-5 sm:size-7" />
                                                  </div>
                                                  <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-bold text-stone-900 sm:text-lg">
                                                      {[lesson.title, lesson.raaga, lesson.thala]
                                                        .filter(Boolean)
                                                        .join(" · ") || "Untitled Lesson"}
                                                    </p>
                                                    <div className="mt-0.5 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-stone-400 sm:text-[10px] sm:tracking-[0.2em]">
                                                      <span className="rounded-full bg-stone-50 px-2 py-0.5">{normalized(lesson)}</span>
                                                      <span className="text-stone-200">•</span>
                                                      <span>{new Date(lesson.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                    </div>
                                                  </div>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                                                  <DropdownMenu modal={false}>
                                                    <DropdownMenuTrigger asChild>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-10 rounded-xl bg-teal-50 px-3 text-teal-600 transition-all hover:bg-teal-600 hover:text-white hover:shadow-lg hover:shadow-teal-900/10 active:scale-95 sm:h-11 sm:rounded-2xl sm:px-5"
                                                      >
                                                        <UserPlus className="size-4 sm:mr-2" />
                                                        <span className="hidden text-[10px] font-black uppercase tracking-widest sm:inline">Add to another</span>
                                                        <span className="text-[10px] font-black uppercase tracking-widest sm:hidden">Copy</span>
                                                      </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="min-w-[200px] rounded-2xl p-2 shadow-2xl ring-1 ring-black/5">
                                                      <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-stone-400">Add to student</DropdownMenuLabel>
                                                      <div className="my-1 h-px bg-stone-50" />
                                                      {students
                                                        .filter((st) => st.id !== s.id)
                                                        .map((st) => {
                                                          const isCopying =
                                                            copyingTo?.lessonId === lesson.id && copyingTo?.studentId === st.id;
                                                          const dName = st.fullName || st.email || st.id;
                                                          return (
                                                            <DropdownMenuItem
                                                              key={st.id}
                                                              onClick={() => copyLessonToStudent(lesson.id, st.id)}
                                                              disabled={!!copyingTo}
                                                              className="rounded-xl px-3 py-2.5 text-sm font-bold text-stone-700 focus:bg-teal-50 focus:text-teal-700 cursor-pointer"
                                                            >
                                                              {isCopying ? (
                                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                                              ) : null}
                                                              {dName}
                                                            </DropdownMenuItem>
                                                          );
                                                        })}
                                                      {students.filter((st) => st.id !== s.id).length === 0 && (
                                                        <DropdownMenuItem disabled className="text-stone-400 italic">
                                                          No other students
                                                        </DropdownMenuItem>
                                                      )}
                                                    </DropdownMenuContent>
                                                  </DropdownMenu>

                                                  <div className="hidden shrink-0 items-center gap-1 sm:flex">
                                                    <div className="h-6 w-px bg-stone-100 mx-1" />
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => setEditingLessonId(lesson.id)}
                                                      className="h-10 w-10 rounded-full p-0 text-stone-200 hover:bg-stone-50 hover:text-stone-400 transition-colors"
                                                      title="Edit lesson"
                                                    >
                                                      <Pencil className="size-4" />
                                                    </Button>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() =>
                                                        setDeleteLessonTarget({
                                                          lessonId: lesson.id,
                                                          studentId: s.id,
                                                          title: lesson.title ?? ([lesson.raaga, lesson.thala].filter(Boolean).join(" · ") || undefined),
                                                        })
                                                      }
                                                      className="h-10 w-10 rounded-full p-0 text-stone-100 hover:bg-red-50 hover:text-red-400 transition-colors"
                                                      title="Delete lesson"
                                                    >
                                                      <Trash2 className="size-4" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="border-t border-stone-100 bg-stone-50/30 p-4 sm:p-8">
                                                <div className="space-y-6">
                                                  <div className="flex items-center justify-between sm:hidden">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Actions</p>
                                                    <div className="flex gap-2">
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-9 rounded-xl border-stone-200 bg-white px-4 text-[10px] font-bold uppercase tracking-widest text-stone-600 transition-all hover:bg-stone-50"
                                                        onClick={() => setEditingLessonId(lesson.id)}
                                                      >
                                                        <Pencil className="mr-2 size-3.5" />
                                                        Edit
                                                      </Button>
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-9 rounded-xl border-red-100 bg-white px-4 text-[10px] font-bold uppercase tracking-widest text-red-500 transition-all hover:bg-red-50 hover:border-red-200"
                                                        onClick={() =>
                                                          setDeleteLessonTarget({
                                                            lessonId: lesson.id,
                                                            studentId: s.id,
                                                            title: lesson.title ?? ([lesson.raaga, lesson.thala].filter(Boolean).join(" · ") || undefined),
                                                          })
                                                        }
                                                      >
                                                        <Trash2 className="mr-2 size-3.5" />
                                                        Delete
                                                      </Button>
                                                    </div>
                                                  </div>

                                                  {lesson.lyrics?.trim() && (
                                                    <section className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
                                                      <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50/50 px-4 py-2.5">
                                                        <FileText className="size-3.5 text-teal-600" />
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Lyrics</p>
                                                      </div>
                                                      <div className="max-h-60 overflow-auto px-6 py-6 font-serif text-base leading-relaxed text-stone-700">
                                                        {lesson.lyrics}
                                                      </div>
                                                    </section>
                                                  )}

                                                  {lesson.lyrics_image_paths?.length ? (
                                                    <section className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
                                                      <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50/50 px-4 py-2.5">
                                                        <FileImage className="size-3.5 text-teal-600" />
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Sheet Music / Images</p>
                                                      </div>
                                                      <div className="p-4">
                                                        <LyricsImages lessonId={lesson.id} />
                                                      </div>
                                                    </section>
                                                  ) : null}

                                                  {lesson.audio_path?.trim() && (
                                                    <section className="overflow-visible rounded-2xl border border-stone-100 bg-white shadow-sm">
                                                      <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50/50 px-4 py-2.5">
                                                        <Music2 className="size-3.5 text-teal-600" />
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Audio Recording</p>
                                                      </div>
                                                      <div className="p-4 sm:p-6">
                                                        <LessonPlayer lessonId={lesson.id} />
                                                      </div>
                                                    </section>
                                                  )}
                                                </div>
                                              </div>
                                            </>
                                          )}
                                        </li>
                                      ))}
                                      {filtered.length === 0 && lessonSearchQuery && (
                                        <div className="rounded-[2rem] border border-dashed border-stone-200 bg-stone-50/50 py-16 px-8 text-center">
                                          <p className="text-sm font-bold text-stone-400 italic">No matches found for your search.</p>
                                        </div>
                                      )}
                                    </ul>
                                  </div>
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {pastStudents.length > 0 && (
          <Card className="overflow-hidden border-stone-200/80 bg-white/90 shadow-md shadow-stone-200/50 ring-1 ring-stone-200/50">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50 pb-4">
              <CardTitle className="flex items-center gap-2 font-serif text-xl font-semibold text-stone-700">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Archive className="size-4" />
                </span>
                Past Students
              </CardTitle>
              <p className="text-sm text-stone-500">Students who have left your class</p>
            </CardHeader>
            <CardContent className="pt-6">
            <ul className="space-y-3">
              {pastStudents.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-stone-200/80 bg-stone-50/80 px-4 py-3 shadow-sm transition-shadow hover:shadow"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-stone-700">
                      {s.fullName || s.email || s.id}
                    </span>
                    {s.removedAt && (
                      <span className="ml-2 text-xs text-stone-400">
                        Removed {new Date(s.removedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addStudentBack(s.id)}
                    disabled={restoringId === s.id}
                    className="shrink-0 border-teal-200 bg-teal-50/50 font-medium text-teal-700 hover:bg-teal-100 hover:text-teal-800"
                  >
                    {restoringId === s.id ? "Adding…" : (
                      <>
                        <UserPlus className="mr-1.5 h-4 w-4" />
                        Add back
                      </>
                    )}
                  </Button>
                </li>
              ))}
            </ul>
            </CardContent>
          </Card>
        )}

        <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && closeRemoveDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove student</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget
                ? `Remove ${removeTarget.displayName} from your student list? They will no longer appear and you won't be able to send new lessons to them.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!removingId}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              onClick={confirmRemoveStudent}
              disabled={!!removingId}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600/50"
            >
              {removingId ? "Removing…" : "Remove"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        <AlertDialog open={!!deleteLessonTarget} onOpenChange={(open) => !open && setDeleteLessonTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete lesson</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteLessonTarget
                  ? `Remove this lesson${deleteLessonTarget.title ? ` "${deleteLessonTarget.title}"` : ""} from the student? This cannot be undone.`
                  : ""}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={!!deletingLessonId}>Cancel</AlertDialogCancel>
              <Button
                type="button"
                onClick={confirmDeleteLesson}
                disabled={!!deletingLessonId}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600/50"
              >
                {deletingLessonId ? "Deleting…" : "Delete"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
