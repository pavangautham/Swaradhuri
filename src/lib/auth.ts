import { auth, clerkClient } from "@clerk/nextjs/server";
import { Role, ROLES } from "./constants";

function isValidRole(r: unknown): r is Role {
  return typeof r === "string" && (ROLES as readonly string[]).includes(r);
}

async function getRole(userId: string, sessionClaims: Record<string, unknown> | null): Promise<Role | null> {
  const publicMetadata = (sessionClaims?.publicMetadata || sessionClaims?.public_metadata || {}) as Record<string, unknown>;
  const role = publicMetadata.role || (sessionClaims?.metadata as Record<string, unknown>)?.role;
  
  if (isValidRole(role)) return role;

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userRole = (user.publicMetadata as { role?: unknown })?.role;
    return isValidRole(userRole) ? userRole : null;
  } catch {
    return null;
  }
}

export async function getAuth() {
  return await auth();
}

export async function getCurrentUser() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;
  const role = await getRole(userId, sessionClaims as Record<string, unknown> | null);
  return { userId, role };
}

export async function requireRole(allowedRole: Role) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const role = await getRole(userId, sessionClaims as Record<string, unknown> | null);
  if (role !== allowedRole) {
    throw new Error("Forbidden");
  }

  return { userId, role };
}

export async function requireTeacher() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const role = await getRole(userId, sessionClaims as Record<string, unknown> | null);
  if (role !== "teacher" && role !== "teacher_admin") throw new Error("Forbidden");
  return { userId, role };
}

export async function requireTeacherAdmin() {
  return requireRole("teacher_admin");
}

export async function requireStudent() {
  return requireRole("student");
}

export async function isStudentRemoved(studentId: string): Promise<boolean> {
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("teacher_removed_students")
    .select("id")
    .eq("student_id", studentId)
    .limit(1);
  return !!data && data.length > 0;
}
