import { requireTeacher } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { apiResponse, handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const { userId } = await requireTeacher();
    const supabase = createServerSupabaseClient();

    // 1. Get explicitly linked students
    const { data: links } = await supabase
      .from("teacher_students")
      .select("student_id")
      .eq("teacher_id", userId);

    // 2. Get students from lessons already sent by this teacher
    const { data: lessonStudents } = await supabase
      .from("lessons")
      .select("student_id")
      .eq("teacher_id", userId);

    // 3. Get explicitly removed students
    const { data: removed } = await supabase
      .from("teacher_removed_students")
      .select("student_id")
      .eq("teacher_id", userId);

    const removedSet = new Set((removed ?? []).map((r) => r.student_id));

    // Combine all student IDs that shouldn't be excluded
    const studentIdsSet = new Set<string>();
    (links ?? []).forEach((l) => studentIdsSet.add(l.student_id));
    (lessonStudents ?? []).forEach((l) => studentIdsSet.add(l.student_id));
    
    const activeStudentIds = Array.from(studentIdsSet).filter((id) => !removedSet.has(id));

    if (activeStudentIds.length === 0) {
      return apiResponse([]);
    }

    // Ensure all these active students are explicitly in teacher_students table
    // This helps resolve the "Student not in your list" error by ensuring the association record exists.
    for (const sid of activeStudentIds) {
      await supabase.from("teacher_students").upsert(
        { teacher_id: userId, student_id: sid },
        { onConflict: "teacher_id,student_id" }
      );
    }

    // Fetch user details for these students
    const { data: students } = await supabase
      .from("users")
      .select("clerk_id, email, full_name")
      .in("clerk_id", activeStudentIds)
      .order("full_name");

    const studentMap = new Map(
      (students ?? []).map((s) => [
        s.clerk_id, 
        { id: s.clerk_id, email: s.email ?? null, fullName: s.full_name ?? null }
      ])
    );
    
    const result = activeStudentIds.map(
      (id) => studentMap.get(id) ?? { id, email: null, fullName: null }
    );

    return apiResponse(result);
  } catch (e) {
    return handleApiError(e);
  }
}
