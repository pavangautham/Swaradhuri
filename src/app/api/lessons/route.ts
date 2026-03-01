import { NextRequest } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { apiResponse, handleApiError, parseFormData } from "@/lib/api-utils";
import { MAX_AUDIO_SIZE, MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES, ALLOWED_AUDIO_EXTENSIONS } from "@/lib/constants";
import { createLesson, handleLessonUploads } from "@/lib/services/lessons";
import { createLibraryItem, handleLibraryUploads } from "@/lib/services/library";

export async function GET(request: NextRequest) {
  try {
    const { userId: teacherId } = await requireTeacher();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("student_id");

    const supabase = createServerSupabaseClient();
    let query = supabase
      .from("lessons")
      .select("id, student_id, lyrics, title, raaga, thala, category, audio_path, lyrics_image_paths, created_at")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });

    if (studentId) {
      query = query.eq("student_id", studentId);
    }

    const { data: lessons, error } = await query;
    if (error) throw error;

    return apiResponse(lessons ?? []);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: teacherId } = await requireTeacher();
    const formData = await parseFormData(request);

    const studentId = formData.get("student_id") as string | null;
    const lyrics = formData.get("lyrics") as string | null;
    const title = (formData.get("title") as string | null)?.trim() || null;
    const raaga = (formData.get("raaga") as string | null)?.trim() || null;
    const thala = (formData.get("thala") as string | null)?.trim() || null;
    const category = (formData.get("category") as string | null)?.trim() || null;
    const audioFile = formData.get("audio") as File | null;
    const lyricsImageFiles = (formData.getAll("lyrics_image") as File[]).filter(
      (f): f is File => f instanceof File && f.size > 0
    );

    // Validations
    if (!studentId?.trim()) return apiResponse({ error: "Student is required" }, 400);
    if (!lyrics?.trim()) return apiResponse({ error: "Lyrics are required" }, 400);

    for (const img of lyricsImageFiles) {
      if (img.size > MAX_IMAGE_SIZE) return apiResponse({ error: `Lyrics image "${img.name}" must be under 5MB` }, 400);
      if (!ALLOWED_IMAGE_TYPES.includes(img.type)) return apiResponse({ error: "Lyrics images must be JPG, PNG, or WebP" }, 400);
    }

    const hasAudio = audioFile && audioFile.size > 0 && audioFile instanceof File;
    if (hasAudio) {
      if (audioFile.size > MAX_AUDIO_SIZE) return apiResponse({ error: "Audio file must be under 10MB" }, 400);
      const ext = audioFile.name.split(".").pop()?.toLowerCase();
      if (!ext || !ALLOWED_AUDIO_EXTENSIONS.includes(ext)) return apiResponse({ error: "Only MP3, M4A, or AAC files are allowed" }, 400);
    }

    const supabase = createServerSupabaseClient();
    
    // Ensure student is linked to teacher
    await supabase.from("teacher_students").upsert(
      { teacher_id: teacherId, student_id: studentId },
      { onConflict: "teacher_id,student_id" }
    );

    const lesson = await createLesson(supabase, {
      teacher_id: teacherId,
      student_id: studentId,
      lyrics: lyrics.trim(),
      title,
      raaga,
      thala,
      category,
      audio_path: "",
    });

    try {
      await handleLessonUploads(supabase, lesson.id, teacherId, hasAudio ? audioFile : null, lyricsImageFiles);
    } catch (uploadError) {
      await supabase.from("lessons").delete().eq("id", lesson.id);
      throw uploadError;
    }

    return apiResponse({ id: lesson.id });
  } catch (e) {
    return handleApiError(e);
  }
}
