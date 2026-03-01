import { NextRequest } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { apiResponse, handleApiError, parseFormData } from "@/lib/api-utils";
import { MAX_AUDIO_SIZE, MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES, ALLOWED_AUDIO_EXTENSIONS } from "@/lib/constants";
import { updateLesson, handleLessonUploads, deleteLesson } from "@/lib/services/lessons";
import { deleteFiles } from "@/lib/services/storage";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: teacherId } = await requireTeacher();
    const { id } = await params;

    const contentType = request.headers.get("content-type") ?? "";
    let title: string | null | undefined;
    let raaga: string | null | undefined;
    let thala: string | null | undefined;
    let category: string | null | undefined;
    let lyrics: string | undefined;
    let audioFile: File | null = null;
    let lyricsImageFiles: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await parseFormData(request);
      title = (formData.get("title") as string | null)?.trim() || null;
      raaga = (formData.get("raaga") as string | null)?.trim() || null;
      thala = (formData.get("thala") as string | null)?.trim() || null;
      category = (formData.get("category") as string | null)?.trim() || null;
      lyrics = (formData.get("lyrics") as string | null)?.trim();
      audioFile = formData.get("audio") as File | null;
      if (audioFile && (audioFile.size === 0 || !(audioFile instanceof File))) {
        audioFile = null;
      }
      lyricsImageFiles = (formData.getAll("lyrics_image") as File[]).filter(
        (f): f is File => f instanceof File && f.size > 0
      );
      
      // Validations
      for (const img of lyricsImageFiles) {
        if (img.size > MAX_IMAGE_SIZE) return apiResponse({ error: `Lyrics image "${img.name}" must be under 5MB` }, 400);
        if (!ALLOWED_IMAGE_TYPES.includes(img.type)) return apiResponse({ error: "Lyrics images must be JPG, PNG, or WebP" }, 400);
      }
      if (audioFile) {
        if (audioFile.size > MAX_AUDIO_SIZE) return apiResponse({ error: "Audio must be under 10MB" }, 400);
        const ext = audioFile.name.split(".").pop()?.toLowerCase();
        if (!ext || !ALLOWED_AUDIO_EXTENSIONS.includes(ext)) return apiResponse({ error: "Only MP3 files are allowed" }, 400);
      }
    } else {
      const body = await request.json();
      title = typeof body.title === "string" ? body.title.trim() || null : undefined;
      raaga = typeof body.raaga === "string" ? body.raaga.trim() || null : undefined;
      thala = typeof body.thala === "string" ? body.thala.trim() || null : undefined;
      category = body.category === null || body.category === ""
        ? null
        : typeof body.category === "string"
          ? body.category.trim() || null
          : undefined;
      lyrics = typeof body.lyrics === "string" ? body.lyrics.trim() : undefined;
    }

    if (!lyrics) return apiResponse({ error: "Lyrics are required" }, 400);

    const supabase = createServerSupabaseClient();
    const { data: existing, error: fetchError } = await supabase
      .from("lessons")
      .select("id, teacher_id, lyrics_image_paths")
      .eq("id", id)
      .single();

    if (fetchError || !existing || existing.teacher_id !== teacherId) {
      return apiResponse({ error: "Not found" }, 404);
    }

    await updateLesson(supabase, id, teacherId, {
      lyrics,
      ...(title !== undefined && { title }),
      ...(raaga !== undefined && { raaga }),
      ...(thala !== undefined && { thala }),
      ...(category !== undefined && { category }),
    });

    if (audioFile || lyricsImageFiles.length > 0) {
      if (lyricsImageFiles.length > 0) {
        const oldPaths = (existing.lyrics_image_paths as string[] | null) ?? [];
        if (oldPaths.length > 0) {
          await deleteFiles(supabase, oldPaths);
        }
      }
      await handleLessonUploads(supabase, id, teacherId, audioFile, lyricsImageFiles);
    }

    return apiResponse({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: teacherId } = await requireTeacher();
    const { id } = await params;
    const supabase = createServerSupabaseClient();
    
    await deleteLesson(supabase, id, teacherId);
    
    return apiResponse({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
