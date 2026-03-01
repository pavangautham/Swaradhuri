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
      .select("audio_path, teacher_id")
      .eq("id", id)
      .single();

    if (fetchError || !item || item.teacher_id !== teacherId) {
      return apiResponse({ error: "Not found" }, 404);
    }

    if (!item.audio_path) {
      return apiResponse({ error: "No audio for this item" }, 404);
    }

    const url = await getSignedUrl(supabase, item.audio_path);

    return apiResponse({ url });
  } catch (e) {
    return handleApiError(e);
  }
}
