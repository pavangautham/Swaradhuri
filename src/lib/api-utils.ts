import { NextResponse } from "next/server";

export function apiResponse<T>(data: T, status = 200) {
  const response = NextResponse.json(data, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function apiError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(e: unknown) {
  console.error("API Error:", e);
  
  if (e instanceof Error) {
    if (e.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    if (e.message === "Forbidden") {
      return apiError("Forbidden", 403);
    }
    return apiError(e.message || "Unknown error", 500);
  }

  // Handle Supabase/Postgrest error objects
  if (e && typeof e === 'object' && 'message' in e) {
    return apiError(String((e as any).message), 500);
  }
  
  return apiError(JSON.stringify(e) || "An unexpected error occurred", 500);
}

export async function parseFormData(request: Request) {
  try {
    return await request.formData();
  } catch (error) {
    console.error("Form data parse error:", error);
    throw new Error("Invalid form data");
  }
}
