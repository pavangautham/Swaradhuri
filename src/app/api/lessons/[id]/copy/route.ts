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
    const { id: sourceLessonId } = await params;

    const body = await request.json();
    const targetStudentId = body?.target_student_id?.trim();
    if (!targetStudentId) {
      return apiResponse({ error: "target_student_id is required" }, 400);
    }

    const supabase = createServerSupabaseClient();

    const { data: source, error: fetchError } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", sourceLessonId)
      .single();

    if (fetchError || !source || source.teacher_id !== teacherId) {
      return apiResponse({ error: "Lesson not found" }, 404);
    }

    if (source.student_id === targetStudentId) {
      return apiResponse({ error: "This lesson already belongs to that student" }, 400);
    }

    // Verify target student
    const { data: link } = await supabase
      .from("teacher_students")
      .select("id")
      .eq("teacher_id", teacherId)
      .eq("student_id", targetStudentId)
      .single();

    if (!link) {
      return apiResponse({ error: "Target student not in your list" }, 403);
    }

    const newLesson = await createLesson(supabase, {
      teacher_id: teacherId,
      student_id: targetStudentId,
      lyrics: source.lyrics,
      title: source.title,
      raaga: source.raaga,
      thala: source.thala,
      category: source.category,
      audio_path: "",
    });

    let audioPath = "";
    if (source.audio_path) {
      const targetPath = `${teacherId}/${newLesson.id}.mp3`;
      const copied = await copyStorageFile(supabase, source.audio_path, targetPath, "audio/mpeg");
      if (copied) audioPath = targetPath;
    }

    const oldImagePaths = (source.lyrics_image_paths as string[] | null) ?? [];
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

    return apiResponse({ id: newLesson.id });
  } catch (e) {
    return handleApiError(e);
  }
}
