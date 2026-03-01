import { SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_BUCKET } from "../constants";
import { uploadFile } from "./storage";

export async function copyStorageFile(
  supabase: SupabaseClient,
  sourcePath: string,
  targetPath: string,
  contentType: string
) {
  const { data: blob, error: downloadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(sourcePath);

  if (downloadError || !blob) {
    console.error(`Failed to download ${sourcePath}:`, downloadError);
    return null;
  }

  const buffer = Buffer.from(await blob.arrayBuffer());
  return await uploadFile(supabase, targetPath, buffer, contentType);
}
