import { NextRequest } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { apiResponse, handleApiError } from "@/lib/api-utils";

export async function PATCH(request: NextRequest) {
  try {
    const { userId: teacherId } = await requireTeacher();
    const body = await request.json();
    const currentName = typeof body.currentName === "string" ? body.currentName.trim() : "";
    const newName = typeof body.newName === "string" ? body.newName.trim() : "";
    
    if (!currentName || !newName) {
      return apiResponse({ error: "currentName and newName are required" }, 400);
    }
    
    const supabase = createServerSupabaseClient();
    
    // Rename in library
    await supabase
      .from("lesson_library")
      .update({ category: newName })
      .eq("teacher_id", teacherId)
      .eq("category", currentName);

    // Rename in student lessons as well for consistency
    await supabase
      .from("lessons")
      .update({ category: newName })
      .eq("teacher_id", teacherId)
      .eq("category", currentName);

    return apiResponse({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function GET() {
  try {
    const { userId: teacherId } = await requireTeacher();
    const supabase = createServerSupabaseClient();
    
    // Fetch categories from both library and student lessons
    const [libResult, lessonResult] = await Promise.all([
      supabase.from("lesson_library").select("category").eq("teacher_id", teacherId),
      supabase.from("lessons").select("category").eq("teacher_id", teacherId)
    ]);

    if (libResult.error) throw libResult.error;
    if (lessonResult.error) throw lessonResult.error;

    const categoriesMap = new Map<string, number>();
    
    // Combine results
    const allRows = [...(libResult.data ?? []), ...(lessonResult.data ?? [])];
    
    allRows.forEach(row => {
      const cat = row.category?.trim();
      if (cat) {
        // We use the count from the library primarily, but ensure the key exists
        categoriesMap.set(cat, (categoriesMap.get(cat) ?? 0) + 1);
      }
    });

    const result = Array.from(categoriesMap.keys())
      .map(name => ({ 
        name, 
        // Count represents how many times it appears in the Library specifically
        // (or just total usage if we prefer)
        count: (libResult.data ?? []).filter(r => r.category?.trim() === name).length 
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return apiResponse(result);
  } catch (e) {
    return handleApiError(e);
  }
}
