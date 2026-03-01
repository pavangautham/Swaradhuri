import { NextRequest, NextResponse } from "next/server";
import { requireTeacher, requireTeacherAdmin } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireTeacher();
    const body = await request.json();
    const { email, role } = body as { email?: string; role?: string };

    const emailNorm = email ? normalizeEmail(email) : "";
    if (!emailNorm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    if (role === "teacher") {
      await requireTeacherAdmin();
    } else if (role === "student") {
      // Teacher or admin can invite students
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("pending_invites").insert({
      email: emailNorm,
      role,
      inviter_id: userId,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Invite already sent" }, { status: 400 });
      }
      return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
