export default function LessonDetailLoading() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-amber-50/40 via-stone-50 to-teal-50/30">
      <div className="flex flex-col items-center gap-3">
        <div className="size-10 animate-spin rounded-full border-2 border-stone-200 border-t-teal-600" />
        <p className="text-sm text-stone-600">Loading lesson…</p>
      </div>
    </div>
  );
}
