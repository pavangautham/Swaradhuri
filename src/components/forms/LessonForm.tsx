"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Plus, 
  ChevronDown, 
  Upload, 
  Music, 
  Loader2, 
  Pencil, 
  X, 
  FileImage, 
  CheckCircle2,
  Users
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lesson, LibraryItem, Category, Student } from "@/types/music";
import { compressMp3 } from "@/lib/compress-audio";
import { MAX_AUDIO_SIZE } from "@/lib/constants";
import { toast } from "sonner";

interface LessonFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  initialData?: Partial<Lesson | LibraryItem> | null;
  categories: Category[];
  students?: Student[];
  showStudentSelect?: boolean;
  onCancel?: () => void;
  defaultCategory?: string;
  submitLabel?: string;
  variant?: "teal" | "amber";
  titleIcon?: React.ReactNode;
  formTitle?: string;
}

export function LessonForm({ 
  onSubmit, 
  initialData, 
  categories, 
  students = [],
  showStudentSelect = false,
  onCancel,
  defaultCategory = "",
  submitLabel,
  variant = "teal",
  titleIcon,
  formTitle
}: LessonFormProps) {
  const [selectedStudent, setSelectedStudent] = useState(('student_id' in (initialData || {}) ? (initialData as any)?.student_id : "") || "");
  const [category, setCategory] = useState(initialData?.category || defaultCategory || "");
  const [isTypingCategory, setIsTypingCategory] = useState(false);
  const [title, setTitle] = useState(initialData?.title || "");
  const [raaga, setRaaga] = useState(initialData?.raaga || "");
  const [thala, setThala] = useState(initialData?.thala || "");
  const [lyrics, setLyrics] = useState(initialData?.lyrics || "");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (defaultCategory && !initialData) {
      setCategory(defaultCategory);
    }
  }, [defaultCategory, initialData]);

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setIsTypingCategory(true);
    setDropdownOpen(true);
  };

  const handleCategoryFocus = () => {
    setDropdownOpen(true);
    setIsTypingCategory(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (showStudentSelect && !selectedStudent) {
      toast.error("Please select a student");
      return;
    }

    if (!lyrics.trim()) {
      toast.error("Lyrics are required");
      return;
    }

    setSubmitting(true);
    try {
      let finalAudio: File | null = audioFile;
      if (audioFile && audioFile.size > MAX_AUDIO_SIZE) {
        toast.info("Compressing audio…");
        finalAudio = await compressMp3(audioFile);
      }

      const formData = new FormData();
      if (showStudentSelect) formData.set("student_id", selectedStudent);
      formData.set("category", category.trim());
      formData.set("lyrics", lyrics.trim());
      if (title.trim()) formData.set("title", title.trim());
      if (raaga.trim()) formData.set("raaga", raaga.trim());
      if (thala.trim()) formData.set("thala", thala.trim());
      if (finalAudio) formData.set("audio", finalAudio);
      imageFiles.forEach((f) => formData.append("lyrics_image", f));

      await onSubmit(formData);
      
      if (!initialData) {
        setTitle("");
        setRaaga("");
        setThala("");
        setLyrics("");
        setAudioFile(null);
        setImageFiles([]);
        setSelectedStudent("");
        setFormKey(k => k + 1);
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const isAmber = variant === "amber";
  
  // Map variant to specific Tailwind classes to avoid dynamic interpolation issues with Tailwind 4 scanner
  const themeClasses = {
    teal: {
      border: "border-teal-100",
      bg: "bg-white",
      bgSubtle: "bg-stone-50/50",
      borderSubtle: "border-stone-50",
      accent: "bg-teal-600",
      accentHover: "hover:bg-teal-700",
      accentText: "text-teal-700",
      accentBg: "bg-teal-50/30",
      accentBorder: "border-teal-500",
      accentFocus: "focus:border-teal-400 focus:ring-teal-400/10",
      accentSelection: "bg-teal-50 hover:bg-teal-50 hover:text-teal-800",
      accentBadge: "bg-teal-100/50 text-teal-800"
    },
    amber: {
      border: "border-amber-200/60",
      bg: "bg-amber-50/10",
      bgSubtle: "bg-amber-50/50",
      borderSubtle: "border-amber-50",
      accent: "bg-amber-600",
      accentHover: "hover:bg-amber-700",
      accentText: "text-amber-700",
      accentBg: "bg-amber-50/30",
      accentBorder: "border-amber-500",
      accentFocus: "focus:border-amber-400 focus:ring-amber-400/10",
      accentSelection: "bg-amber-50 hover:bg-amber-50 hover:text-amber-800",
      accentBadge: "bg-amber-100/50 text-amber-800"
    }
  }[variant];

  return (
    <div className={`overflow-hidden rounded-3xl border ${themeClasses.border} ${themeClasses.bg} shadow-xl shadow-stone-200/40`}>
      <div className={`border-b ${themeClasses.borderSubtle} ${themeClasses.bgSubtle} px-6 py-5`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${themeClasses.accent} text-white shadow-lg`}>
            {titleIcon || (initialData ? <Pencil className="size-4" /> : <Plus className="size-4" />)}
          </div>
          <p className="text-base font-bold text-stone-800">
            {formTitle || (initialData ? "Edit Item" : "Add New Item")}
          </p>
        </div>
      </div>
      
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {showStudentSelect && (
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-stone-400 px-1">Student</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className={`h-12 border-stone-200 bg-stone-50/30 ${themeClasses.accentFocus}`}>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.fullName || s.email || s.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-widest text-stone-400 px-1">Category</Label>
              <div className="relative" ref={dropdownRef}>
                <Input
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  onFocus={handleCategoryFocus}
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                  placeholder="e.g. Varnas, Krithis"
                  className={`h-12 border-stone-200 bg-stone-50/30 transition-all ${themeClasses.accentFocus} focus:bg-white`}
                />
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-300" />
                {dropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-auto rounded-2xl border border-stone-200 bg-white py-2 shadow-2xl ring-1 ring-black/5">
                    {(() => {
                      const q = category.trim().toLowerCase();
                      const filtered = (isTypingCategory && q)
                        ? categories.filter((c) => c.name.toLowerCase().includes(q))
                        : categories;
                      if (filtered.length === 0) {
                        return <p className="px-4 py-3 text-xs text-stone-400 italic">Type to add new category...</p>;
                      }
                      return filtered.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-stone-700 transition-colors ${themeClasses.accentSelection}`}
                          onClick={() => {
                            setCategory(c.name);
                            setDropdownOpen(false);
                          }}
                        >
                          <span className="font-bold">{c.name}</span>
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-black text-stone-400">{c.count}</span>
                        </button>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-widest text-stone-400 px-1">Title <span className="text-stone-300 font-normal ml-1">(optional)</span></Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Bhale Bhale Chandada"
                className={`h-12 border-stone-200 bg-stone-50/30 transition-all ${themeClasses.accentFocus} focus:bg-white`}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-stone-400 px-1">Raaga</Label>
                <Input
                  value={raaga}
                  onChange={(e) => setRaaga(e.target.value)}
                  placeholder="e.g. Mohanam"
                  className={`h-12 border-stone-200 bg-stone-50/30 transition-all ${themeClasses.accentFocus} focus:bg-white`}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-stone-400 px-1">Thala</Label>
                <Input
                  value={thala}
                  onChange={(e) => setThala(e.target.value)}
                  placeholder="e.g. Adi"
                  className={`h-12 border-stone-200 bg-stone-50/30 transition-all ${themeClasses.accentFocus} focus:bg-white`}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-black uppercase tracking-widest text-stone-400 px-1">Lyrics</Label>
            <Textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Paste lyrics…"
              className={`min-h-[120px] resize-none border-stone-200 bg-stone-50/30 transition-all ${themeClasses.accentFocus} focus:bg-white p-4`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-4 transition-all active:scale-95 ${imageFiles.length > 0 ? `${themeClasses.accentBorder} ${themeClasses.accentBg}` : "border-stone-200 bg-stone-50/30 hover:border-stone-300"}`}>
                <Upload className={`size-5 ${imageFiles.length > 0 ? themeClasses.accentText : "text-stone-400"}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest text-center px-2 ${imageFiles.length > 0 ? themeClasses.accentText : "text-stone-500"}`}>
                  {imageFiles.length > 0 ? `${imageFiles.length} Images Selected` : initialData ? "Replace Images" : "Choose Images"}
                </span>
                <Input
                  key={formKey}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))}
                  className="sr-only"
                />
              </label>
              {imageFiles.length > 0 && (
                <div className="flex flex-wrap gap-1 px-1">
                  {imageFiles.map((f, i) => (
                    <div key={i} className={`flex items-center gap-1.5 rounded-full ${themeClasses.accentBadge} px-2 py-1 text-[9px] font-bold`}>
                      <FileImage className="size-2.5 shrink-0" />
                      <span className="max-w-[60px] truncate">{f.name}</span>
                      <button type="button" onClick={() => setImageFiles(prev => prev.filter((_, j) => j !== i))} className="text-stone-400 hover:text-red-500">
                        <X className="size-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-4 transition-all active:scale-95 ${audioFile ? `${themeClasses.accentBorder} ${themeClasses.accentBg}` : "border-stone-200 bg-stone-50/30 hover:border-stone-300"}`}>
                <Music className={`size-5 ${audioFile ? themeClasses.accentText : "text-stone-400"}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest text-center px-2 ${audioFile ? themeClasses.accentText : "text-stone-500"}`}>
                  {audioFile ? "Audio Selected" : initialData ? "Replace Audio" : "Choose Recording"}
                </span>
                <Input
                  key={formKey}
                  type="file"
                  accept="audio/*,.mp3,.m4a,.aac,.wav"
                  onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                  className="sr-only"
                />
              </label>
              {audioFile && (
                <div className={`flex items-center justify-between gap-1.5 rounded-full ${themeClasses.accentBadge} px-3 py-1 text-[9px] font-bold`}>
                  <div className="flex items-center gap-1.5 truncate">
                    <CheckCircle2 className="size-2.5 shrink-0" />
                    <span className="truncate">{audioFile.name}</span>
                  </div>
                  <button type="button" onClick={() => setAudioFile(null)} className="text-stone-400 hover:text-red-500">
                    <X className="size-2.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="submit" 
              disabled={submitting} 
              className={`h-14 flex-1 rounded-2xl ${themeClasses.accent} ${themeClasses.accentHover} text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-stone-200/50 transition-all active:scale-[0.98]`}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-5 animate-spin" />
                  <span>Saving…</span>
                </div>
              ) : (
                submitLabel || (initialData ? "Save Changes" : "Add to Library")
              )}
            </Button>
            {onCancel && (
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onCancel}
                disabled={submitting}
                className="h-14 px-6 rounded-2xl font-bold text-stone-400 hover:bg-stone-100"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
