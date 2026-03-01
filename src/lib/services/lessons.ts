import { SupabaseClient } from "@supabase/supabase-js";
import { uploadFile, deleteFiles } from "./storage";

export type LessonInsert = {
  teacher_id: string;
  student_id: string;
  lyrics: string;
  title?: string | null;
  raaga?: string | null;
  thala?: string | null;
  category?: string | null;
  audio_path?: string;
  lyrics_image_paths?: string[];
};

export async function createLesson(supabase: SupabaseClient, lesson: LessonInsert) {
  const { data, error } = await supabase
    .from("lessons")
    .insert(lesson)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function updateLesson(
  supabase: SupabaseClient,
  id: string,
  teacherId: string,
  updates: Partial<LessonInsert>
) {
  const { error } = await supabase
    .from("lessons")
    .update(updates)
    .eq("id", id)
    .eq("teacher_id", teacherId);

  if (error) throw error;
}

export async function deleteLesson(supabase: SupabaseClient, id: string, teacherId: string) {
  const { data: lesson, error: fetchError } = await supabase
    .from("lessons")
    .select("audio_path, lyrics_image_paths")
    .eq("id", id)
    .eq("teacher_id", teacherId)
    .single();

  if (fetchError || !lesson) throw new Error("Lesson not found");

  const { error: deleteError } = await supabase
    .from("lessons")
    .delete()
    .eq("id", id)
    .eq("teacher_id", teacherId);

  if (deleteError) throw deleteError;

  const pathsToDelete = [];
  if (lesson.audio_path) pathsToDelete.push(lesson.audio_path);
  if (lesson.lyrics_image_paths) pathsToDelete.push(...lesson.lyrics_image_paths);
  
  if (pathsToDelete.length > 0) {
    await deleteFiles(supabase, pathsToDelete);
  }
}

export async function handleLessonUploads(
  supabase: SupabaseClient,
  lessonId: string,
  teacherId: string,
  audioFile?: File | null,
  imageFiles?: File[]
) {
  let audioPath: string | undefined;
  const lyricsImagePaths: string[] = [];

  if (audioFile) {
    const ext = audioFile.name.split(".").pop()?.toLowerCase() || "mp3";
    const path = `${teacherId}/${lessonId}.${ext}`;
    
    // Map extension to correct content type for storage
    const contentTypeMap: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'm4a': 'audio/x-m4a',
      'aac': 'audio/aac',
      'wav': 'audio/wav'
    };
    const contentType = contentTypeMap[ext] || "audio/mpeg";

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    audioPath = await uploadFile(supabase, path, buffer, contentType);
  }

  if (imageFiles && imageFiles.length > 0) {
    for (let i = 0; i < imageFiles.length; i++) {
      const img = imageFiles[i];
      const ext = img.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${teacherId}/${lessonId}-lyrics-${i}.${ext}`;
      const imageBuffer = Buffer.from(await img.arrayBuffer());
      const uploadedPath = await uploadFile(supabase, path, imageBuffer, img.type);
      lyricsImagePaths.push(uploadedPath);
    }
  }

  if (audioPath || lyricsImagePaths.length > 0) {
    await updateLesson(supabase, lessonId, teacherId, {
      ...(audioPath && { audio_path: audioPath }),
      ...(lyricsImagePaths.length > 0 && { lyrics_image_paths: lyricsImagePaths }),
    });
  }
}
