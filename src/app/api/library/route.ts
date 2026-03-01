import { NextRequest } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { apiResponse, handleApiError, parseFormData } from "@/lib/api-utils";
import { MAX_AUDIO_SIZE, MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES, ALLOWED_AUDIO_EXTENSIONS } from "@/lib/constants";
import { createLibraryItem, handleLibraryUploads } from "@/lib/services/library";

export async function GET(request: NextRequest) {
  try {
    const { userId: teacherId } = await requireTeacher();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category")?.trim();

    const supabase = createServerSupabaseClient();
    let query = supabase
      .from("lesson_library")
      .select("id, category, title, raaga, thala, lyrics, audio_path, lyrics_image_paths, created_at")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) throw error;

    return apiResponse(data ?? []);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: teacherId } = await requireTeacher();
    const formData = await parseFormData(request);

    const category = (formData.get("category") as string)?.trim();
    if (!category) return apiResponse({ error: "Category is required" }, 400);

    const lyrics = (formData.get("lyrics") as string)?.trim();
    if (!lyrics) return apiResponse({ error: "Lyrics are required" }, 400);

    const title = (formData.get("title") as string)?.trim() || null;
    const raaga = (formData.get("raaga") as string)?.trim() || null;
    const thala = (formData.get("thala") as string)?.trim() || null;
    
    const audioFile = formData.get("audio") as File | null;
    const lyricsImageFiles = (formData.getAll("lyrics_image") as File[]).filter(
      (f): f is File => f instanceof File && f.size > 0
    );

    // Validations
    for (const img of lyricsImageFiles) {
      if (img.size > MAX_IMAGE_SIZE) return apiResponse({ error: `Lyrics image "${img.name}" must be under 5MB` }, 400);
      if (!ALLOWED_IMAGE_TYPES.includes(img.type)) return apiResponse({ error: "Lyrics images must be JPG, PNG, or WebP" }, 400);
    }

    const hasAudio = audioFile && audioFile.size > 0 && audioFile instanceof File;
    if (hasAudio) {
      if (audioFile.size > MAX_AUDIO_SIZE) return apiResponse({ error: "Audio file must be under 10MB" }, 400);
      const ext = audioFile.name.split(".").pop()?.toLowerCase();
      if (!ext || !ALLOWED_AUDIO_EXTENSIONS.includes(ext)) return apiResponse({ error: "Only MP3 files are allowed" }, 400);
    }

    const supabase = createServerSupabaseClient();
    
    // Create record first
    const item = await createLibraryItem(supabase, {
      teacher_id: teacherId,
      category,
      lyrics,
      title,
      raaga,
      thala,
      audio_path: "",
    });

    try {
      await handleLibraryUploads(supabase, item.id, teacherId, hasAudio ? audioFile : null, lyricsImageFiles);
    } catch (uploadError) {
      // Cleanup if upload fails
      await supabase.from("lesson_library").delete().eq("id", item.id);
      throw uploadError;
    }

    return apiResponse({ id: item.id });
  } catch (e) {
    return handleApiError(e);
  }
}
