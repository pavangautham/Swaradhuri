export type Lesson = {
  id: string;
  student_id?: string;
  teacher_id: string;
  lyrics: string;
  title?: string | null;
  raaga?: string | null;
  thala?: string | null;
  category?: string | null;
  audio_path?: string | null;
  lyrics_image_paths?: string[] | null;
  created_at: string;
};

export type LibraryItem = {
  id: string;
  category: string;
  title: string | null;
  raaga: string | null;
  thala: string | null;
  lyrics: string;
  audio_path?: string | null;
  lyrics_image_paths: string[] | null;
  created_at: string;
};

export type Category = {
  name: string;
  count: number;
};

export type Student = {
  id: string;
  email: string | null;
  fullName: string | null;
};
