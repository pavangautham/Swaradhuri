"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, Loader2, CheckSquare, Square } from "lucide-react";
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogCancel 
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LibraryItem, Student } from "@/types/music";
import { toast } from "sonner";

interface SendToStudentsDialogProps {
  item: LibraryItem | null;
  onClose: () => void;
}

export function SendToStudentsDialog({ item, onClose }: SendToStudentsDialogProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/students", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (item) {
      fetchStudents();
      setSelectedIds([]);
    }
  }, [item, fetchStudents]);

  const handleSend = async () => {
    if (!item || selectedIds.length === 0) return;
    setSending(true);
    try {
      const res = await fetch(`/api/library/${item.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to send");
      }
      toast.success(`Lesson sent to ${selectedIds.length} student(s)`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const toggleAll = () => {
    if (selectedIds.length === students.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map((s) => s.id));
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <AlertDialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Send className="size-5 text-teal-600" />
            Send to Student(s)
          </AlertDialogTitle>
          <AlertDialogDescription>
            Select students to send &quot;{item?.title || [item?.raaga, item?.thala].filter(Boolean).join(" · ") || "this lesson"}&quot; to.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 max-h-60 overflow-y-auto pr-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-teal-600" />
            </div>
          ) : students.length === 0 ? (
            <p className="py-4 text-center text-sm text-stone-500">
              No students found. Go to Students page to add some.
            </p>
          ) : (
            <div className="space-y-1">
              <button
                type="button"
                onClick={toggleAll}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                {selectedIds.length === students.length ? (
                  <CheckSquare className="size-4 text-teal-600" />
                ) : (
                  <Square className="size-4 text-stone-400" />
                )}
                Select All ({students.length})
              </button>
              <div className="h-px bg-stone-100 my-1" />
              {students.map((st) => {
                const isSelected = selectedIds.includes(st.id);
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => toggleStudent(st.id)}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm text-stone-600 hover:bg-stone-50"
                  >
                    {isSelected ? (
                      <CheckSquare className="size-4 text-teal-600" />
                    ) : (
                      <Square className="size-4 text-stone-400" />
                    )}
                    {st.fullName || st.email || st.id}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
          <Button
            onClick={handleSend}
            disabled={sending || selectedIds.length === 0}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Sending…
              </>
            ) : (
              `Send to ${selectedIds.length} student${selectedIds.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
