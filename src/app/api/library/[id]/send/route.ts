import { NextRequest } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { apiResponse, handleApiError } from "@/lib/api-utils";
import { createLesson, updateLesson } from "@/lib/services/lessons";
import { copyStorageFile } from "@/lib/services/storage-copy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: teacherId } = await requireTeacher();
    const { id: libraryId } = await params;

    const body = await request.json();
    const studentIds = Array.isArray(body?.student_ids)
      ? (body.student_ids as string[]).map((s) => String(s).trim()).filter(Boolean)
      : [];

    if (studentIds.length === 0) {
      return apiResponse({ error: "student_ids array with at least one student is required" }, 400);
    }

    const supabase = createServerSupabaseClient();

    const { data: libItem, error: fetchLibError } = await supabase
      .from("lesson_library")
      .select("*")
      .eq("id", libraryId)
      .single();

    if (fetchLibError || !libItem || libItem.teacher_id !== teacherId) {
      return apiResponse({ error: "Library item not found" }, 404);
    }

    // Verify all students belong to this teacher
    const { data: links } = await supabase
      .from("teacher_students")
      .select("student_id")
      .eq("teacher_id", teacherId)
      .in("student_id", studentIds);

    const allowedStudentIds = new Set((links ?? []).map((r) => r.student_id));
    const invalid = studentIds.filter((id) => !allowedStudentIds.has(id));
    if (invalid.length > 0) {
      return apiResponse({ error: `Not your student(s): ${invalid.join(", ")}` }, 403);
    }

    const created: string[] = [];
    const errors: string[] = [];

    for (const studentId of studentIds) {
      try {
        const newLesson = await createLesson(supabase, {
          teacher_id: teacherId,
          student_id: studentId,
          lyrics: libItem.lyrics,
          title: libItem.title,
          raaga: libItem.raaga,
          thala: libItem.thala,
          category: libItem.category,
          audio_path: "",
        });

        let audioPath = "";
        if (libItem.audio_path) {
          const targetPath = `${teacherId}/${newLesson.id}.mp3`;
          const copied = await copyStorageFile(supabase, libItem.audio_path, targetPath, "audio/mpeg");
          if (copied) audioPath = targetPath;
        }

        const oldImagePaths = (libItem.lyrics_image_paths as string[] | null) ?? [];
        const newImagePaths: string[] = [];
        for (let i = 0; i < oldImagePaths.length; i++) {
          const oldPath = oldImagePaths[i];
          const ext = oldPath.split(".").pop()?.toLowerCase() || "jpg";
          const targetPath = `${teacherId}/${newLesson.id}-lyrics-${i}.${ext}`;
          const copied = await copyStorageFile(supabase, oldPath, targetPath, ext === "jpg" ? "image/jpeg" : `image/${ext}`);
          if (copied) newImagePaths.push(targetPath);
        }

        if (audioPath || newImagePaths.length > 0) {
          await updateLesson(supabase, newLesson.id, teacherId, {
            audio_path: audioPath,
            lyrics_image_paths: newImagePaths,
          });
        }

        created.push(newLesson.id);
      } catch (err) {
        errors.push(`${studentId}: ${err instanceof Error ? err.message : "failed"}`);
      }
    }

    if (created.length === 0) {
      return apiResponse({ error: errors.length > 0 ? errors.join("; ") : "Failed to create lessons" }, 500);
    }

    return apiResponse({
      ok: true,
      created: created.length,
      lesson_ids: created,
      ...(errors.length > 0 && { errors }),
    });
  } catch (e) {
    return handleApiError(e);
  }
}
