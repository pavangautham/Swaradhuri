import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { userId } = await requireTeacher();

    const supabase = createServerSupabaseClient();

    const { data: removed, error: removedError } = await supabase
      .from("teacher_removed_students")
      .select("student_id, removed_at")
      .eq("teacher_id", userId)
      .order("removed_at", { ascending: false });

    if (removedError || !removed?.length) {
      const response = NextResponse.json([]);
      response.headers.set("Cache-Control", "no-store");
      return response;
    }

    const studentIds = removed.map((r) => r.student_id);
    const { data: users } = await supabase
      .from("users")
      .select("clerk_id, email, full_name")
      .in("clerk_id", studentIds);

    const userMap = new Map(
      (users ?? []).map((u) => [u.clerk_id, { email: u.email ?? null, fullName: u.full_name ?? null }])
    );
    const removedMap = new Map(removed.map((r) => [r.student_id, r.removed_at]));

    const result = studentIds.map((id) => {
      const u = userMap.get(id);
      return {
        id,
        email: u?.email ?? null,
        fullName: u?.fullName ?? null,
        removedAt: removedMap.get(id) ?? null,
      };
    });

    const response = NextResponse.json(result);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch removed students" },
      { status: 500 }
    );
  }
}
