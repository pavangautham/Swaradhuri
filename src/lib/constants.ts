export const STORAGE_BUCKET = "recordings";
export const LIBRARY_PREFIX = "library";

export const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ALLOWED_AUDIO_EXTENSIONS = ["mp3", "m4a", "aac", "wav"];

export const ROLES = ["teacher", "student", "teacher_admin", "pending_student"] as const;
export type Role = typeof ROLES[number];
