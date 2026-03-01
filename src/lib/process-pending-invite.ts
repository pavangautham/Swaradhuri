import { clerkClient } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function processPendingInvite(
  userId: string
): Promise<"teacher" | "student" | "pending_student" | null> {
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const email =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? null;
    if (!email) return null;

    const emailNorm = normalizeEmail(email);
    const supabase = createServerSupabaseClient();

    // Check for invite (teacher invites) - only used if we add invite flow back
    const { data: invites } = await supabase
      .from("pending_invites")
      .select("id, role, inviter_id")
      .eq("email", emailNorm);
    const invite = invites?.[0];

    if (invite?.role) {
      const role = invite.role as "teacher" | "student";
      const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

      if (role === "student") {
        await client.users.updateUser(userId, { publicMetadata: { role: "pending_student" } });
        await supabase.from("users").upsert(
          {
            clerk_id: userId,
            email,
            full_name: fullName,
            role: "pending_student",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "clerk_id" }
        );
        await supabase.from("pending_approvals").upsert(
          { teacher_id: invite.inviter_id, student_clerk_id: userId },
          { onConflict: "teacher_id,student_clerk_id" }
        );
        await supabase.from("pending_invites").delete().eq("id", invite.id);
        return "pending_student";
      }

      if (role === "teacher") {
        await client.users.updateUser(userId, { publicMetadata: { role } });
        await supabase.from("users").upsert(
          {
            clerk_id: userId,
            email,
            full_name: fullName,
            role,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "clerk_id" }
        );
        await supabase.from("pending_invites").delete().eq("id", invite.id);
        return role;
      }
    }

    // No invite: new signups go to pending for the single admin/teacher
    let teacherId: string | null = null;

    const { data: adminFromUsers } = await supabase
      .from("users")
      .select("clerk_id")
      .or("role.eq.teacher_admin,role.eq.teacher")
      .limit(1)
      .single();
    teacherId = adminFromUsers?.clerk_id ?? null;

    if (!teacherId) {
      const { data: clerkUsers } = await client.users.getUserList({ limit: 100 });
      const teacher = clerkUsers?.find(
        (u) =>
          u.id !== userId &&
          ((u.publicMetadata as { role?: string })?.role === "teacher_admin" ||
            (u.publicMetadata as { role?: string })?.role === "teacher")
      );
      teacherId = teacher?.id ?? null;
    }

    if (!teacherId) return null;

    const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
    await client.users.updateUser(userId, { publicMetadata: { role: "pending_student" } });
    await supabase.from("users").upsert(
      {
        clerk_id: userId,
        email,
        full_name: fullName,
        role: "pending_student",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clerk_id" }
    );
    await supabase.from("pending_approvals").upsert(
      { teacher_id: teacherId, student_clerk_id: userId },
      { onConflict: "teacher_id,student_clerk_id" }
    );
    return "pending_student";
  } catch {
    return null;
  }
}
