import { NextRequest } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { apiResponse, handleApiError } from "@/lib/api-utils";
import { getSignedUrl } from "@/lib/services/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: teacherId } = await requireTeacher();
    const { id } = await params;

    const supabase = createServerSupabaseClient();
    const { data: item, error: fetchError } = await supabase
      .from("lesson_library")
      .select("lyrics_image_paths, teacher_id")
      .eq("id", id)
      .single();

    if (fetchError || !item || item.teacher_id !== teacherId) {
      return apiResponse({ error: "Not found" }, 404);
    }

    const paths = (item.lyrics_image_paths as string[] | null) ?? [];
    if (paths.length === 0) {
      return apiResponse({ urls: [] });
    }

    const urls: string[] = [];
    for (const p of paths) {
      const url = await getSignedUrl(supabase, p);
      urls.push(url);
    }

    return apiResponse({ urls });
  } catch (e) {
    return handleApiError(e);
  }
}
