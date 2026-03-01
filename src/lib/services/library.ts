import { SupabaseClient } from "@supabase/supabase-js";
import { LIBRARY_PREFIX } from "../constants";
import { uploadFile, deleteFiles } from "./storage";

export type LibraryItemInsert = {
  teacher_id: string;
  category: string;
  title?: string | null;
  raaga?: string | null;
  thala?: string | null;
  lyrics: string;
  audio_path?: string;
  lyrics_image_paths?: string[];
};

export async function createLibraryItem(supabase: SupabaseClient, item: LibraryItemInsert) {
  const { data, error } = await supabase
    .from("lesson_library")
    .insert(item)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function updateLibraryItem(
  supabase: SupabaseClient,
  id: string,
  teacherId: string,
  updates: Partial<LibraryItemInsert>
) {
  const { error } = await supabase
    .from("lesson_library")
    .update(updates)
    .eq("id", id)
    .eq("teacher_id", teacherId);

  if (error) throw error;
}

export async function deleteLibraryItem(supabase: SupabaseClient, id: string, teacherId: string) {
  const { data: item, error: fetchError } = await supabase
    .from("lesson_library")
    .select("audio_path, lyrics_image_paths")
    .eq("id", id)
    .eq("teacher_id", teacherId)
    .single();

  if (fetchError || !item) throw new Error("Item not found");

  const { error: deleteError } = await supabase
    .from("lesson_library")
    .delete()
    .eq("id", id)
    .eq("teacher_id", teacherId);

  if (deleteError) throw deleteError;

  // Cleanup storage
  const pathsToDelete = [];
  if (item.audio_path) pathsToDelete.push(item.audio_path);
  if (item.lyrics_image_paths) pathsToDelete.push(...item.lyrics_image_paths);
  
  if (pathsToDelete.length > 0) {
    await deleteFiles(supabase, pathsToDelete);
  }
}

export async function handleLibraryUploads(
  supabase: SupabaseClient,
  itemId: string,
  teacherId: string,
  audioFile?: File | null,
  imageFiles?: File[]
) {
  let audioPath: string | undefined;
  const lyricsImagePaths: string[] = [];

  if (audioFile) {
    const path = `${LIBRARY_PREFIX}/${teacherId}/${itemId}.mp3`;
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    audioPath = await uploadFile(supabase, path, buffer, "audio/mpeg");
  }

  if (imageFiles && imageFiles.length > 0) {
    for (let i = 0; i < imageFiles.length; i++) {
      const img = imageFiles[i];
      const ext = img.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${LIBRARY_PREFIX}/${teacherId}/${itemId}-lyrics-${i}.${ext}`;
      const imageBuffer = Buffer.from(await img.arrayBuffer());
      const uploadedPath = await uploadFile(supabase, path, imageBuffer, img.type);
      lyricsImagePaths.push(uploadedPath);
    }
  }

  if (audioPath || lyricsImagePaths.length > 0) {
    await updateLibraryItem(supabase, itemId, teacherId, {
      ...(audioPath && { audio_path: audioPath }),
      ...(lyricsImagePaths.length > 0 && { lyrics_image_paths: lyricsImagePaths }),
    });
  }
}
