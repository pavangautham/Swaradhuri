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
      .select("lyrics_image_paths, student_id, teacher_id")
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

    const paths = (lesson.lyrics_image_paths as string[] | null) ?? [];
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
