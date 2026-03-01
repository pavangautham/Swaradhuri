import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireTeacher } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { userId: teacherId } = await requireTeacher();
    const supabase = createServerSupabaseClient();

    const { data: pending, error } = await supabase
      .from("pending_approvals")
      .select("id, student_clerk_id, created_at")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Pending approvals fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!pending?.length) {
      const response = NextResponse.json([]);
      response.headers.set("Cache-Control", "no-store");
      return response;
    }

    const clerkIds = [...new Set(pending.map((p) => p.student_clerk_id))];
    const client = await clerkClient();
    const users = await Promise.all(
      clerkIds.map((id) => client.users.getUser(id).catch(() => null))
    );
    const userMap = new Map(users.filter(Boolean).map((u) => [u!.id, u!]));

    const result = pending.map((p) => {
      const u = userMap.get(p.student_clerk_id);
      return {
        id: p.id,
        studentId: p.student_clerk_id,
        email: u?.emailAddresses[0]?.emailAddress ?? null,
        fullName: [u?.firstName, u?.lastName].filter(Boolean).join(" ") || null,
        createdAt: p.created_at,
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
      { error: e instanceof Error ? e.message : "Failed to fetch pending approvals" },
      { status: 500 }
    );
  }
}
