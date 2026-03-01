/**
 * Match a lesson (or library item) against a search query.
 * Searches title, raaga, thala, lyrics, and optional category (case-insensitive).
 */
export function lessonMatchesSearch(
  lesson: {
    title?: string | null;
    raaga?: string | null;
    thala?: string | null;
    lyrics?: string;
    category?: string | null;
  },
  query: string,
  options?: { includeCategory?: boolean }
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const title = (lesson.title ?? "").toLowerCase();
  const raaga = (lesson.raaga ?? "").toLowerCase();
  const thala = (lesson.thala ?? "").toLowerCase();
  const lyrics = (lesson.lyrics ?? "").toLowerCase();
  const category = (options?.includeCategory && lesson.category) ? (lesson.category ?? "").toLowerCase() : "";

  return (
    title.includes(q) ||
    raaga.includes(q) ||
    thala.includes(q) ||
    lyrics.includes(q) ||
    category.includes(q)
  );
}
