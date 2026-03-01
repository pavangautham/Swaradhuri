import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireTeacher } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: teacherId } = await requireTeacher();
    const { id } = await params;

    const supabase = createServerSupabaseClient();

    const { data: pending, error: fetchError } = await supabase
      .from("pending_approvals")
      .select("id, teacher_id, student_clerk_id")
      .eq("id", id)
      .single();

    if (fetchError || !pending || pending.teacher_id !== teacherId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const studentId = pending.student_clerk_id;
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(studentId);
    const email =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? null;
    const fullName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

    await client.users.updateUser(studentId, {
      publicMetadata: { role: "student" },
    });

    await supabase.from("users").upsert(
      {
        clerk_id: studentId,
        email: email ?? undefined,
        full_name: fullName,
        role: "student",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clerk_id" }
    );

    await supabase
      .from("teacher_students")
      .upsert(
        { teacher_id: teacherId, student_id: studentId },
        { onConflict: "teacher_id,student_id" }
      );

    await supabase.from("pending_approvals").delete().eq("id", id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to approve" },
      { status: 500 }
    );
  }
}
