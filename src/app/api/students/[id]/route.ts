import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: teacherId } = await requireTeacher();
    const { id: studentId } = await params;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    const { error: deleteError } = await supabase
      .from("teacher_students")
      .delete()
      .eq("teacher_id", teacherId)
      .eq("student_id", studentId);

    if (deleteError) {
      console.error("Remove student error:", deleteError);
      return NextResponse.json(
        { error: deleteError.message ?? "Failed to remove student" },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabase
      .from("teacher_removed_students")
      .upsert(
        { teacher_id: teacherId, student_id: studentId },
        { onConflict: "teacher_id,student_id" }
      );

    if (insertError) {
      console.error("Insert removed student error:", insertError);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to remove student" },
      { status: 500 }
    );
  }
}
