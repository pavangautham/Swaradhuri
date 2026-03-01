import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { apiResponse, handleApiError } from "@/lib/api-utils";
import { getSignedUrl } from "@/lib/services/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.userId) {
      throw new Error("Unauthorized");
    }
    const { id } = await params;

    const supabase = createServerSupabaseClient();
    const { data: lesson, error: fetchError } = await supabase
      .from("lessons")
      .select("audio_path, student_id, teacher_id")
      .eq("id", id)
      .single();

    if (fetchError || !lesson) {
      return apiResponse({ error: "Not found" }, 404);
    }

    const isStudent = user.role === "student" && lesson.student_id === user.userId;
    const isTeacher = (user.role === "teacher" || user.role === "teacher_admin") && lesson.teacher_id === user.userId;
    
    if (!isStudent && !isTeacher) {
      return apiResponse({ error: "Not found" }, 404);
    }

    if (!lesson.audio_path) {
      return apiResponse({ error: "No audio for this lesson" }, 404);
    }

    const url = await getSignedUrl(supabase, lesson.audio_path);

    return apiResponse({ url });
  } catch (e) {
    return handleApiError(e);
  }
}
