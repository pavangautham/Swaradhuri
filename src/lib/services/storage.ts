import { SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_BUCKET } from "../constants";

export async function uploadFile(
  supabase: SupabaseClient,
  path: string,
  file: File | Buffer,
  contentType: string
) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Storage upload error: ${error.message}`);
  }

  return data.path;
}

export async function deleteFiles(supabase: SupabaseClient, paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);
  if (error) {
    console.error("Storage delete error:", error);
  }
}

export async function getSignedUrl(supabase: SupabaseClient, path: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Storage signed URL error: ${error.message}`);
  }

  return data.signedUrl;
}
