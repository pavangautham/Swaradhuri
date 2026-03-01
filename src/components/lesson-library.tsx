"use client";

import { useState } from "react";
import { BookMarked, RefreshCw, Loader2, Search, Pencil, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { lessonMatchesSearch } from "@/lib/lesson-search";
import { useLibrary } from "@/hooks/library/use-library";
import { CategoryTabs } from "./library/CategoryTabs";
import { LessonForm } from "./forms/LessonForm";
import { LibraryItemCard } from "./library/LibraryItemCard";
import { SendToStudentsDialog } from "./library/SendToStudentsDialog";
import { LibraryItem } from "@/types/music";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type LessonLibraryProps = { variant?: "card" | "page" };

export function LessonLibrary({ variant = "card" }: LessonLibraryProps) {
  const isPage = variant === "page";
  const {
    categories,
    categoriesLoading,
    category,
    setCategory,
    items,
    itemsLoading,
    addItem,
    updateItem,
    deleteItem,
    renameCategory,
    refresh
  } = useLibrary();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LibraryItem | null>(null);
  const [sendTarget, setSendTarget] = useState<LibraryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const handleRename = async () => {
    if (!renameValue.trim() || renameValue === category) {
      setRenaming(false);
      return;
    }
    setIsRenaming(true);
    try {
      await renameCategory(category, renameValue.trim());
      toast.success("Category renamed");
      setRenaming(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to rename");
    } finally {
      setIsRenaming(false);
    }
  };

  const filteredItems = items.filter((item) => 
    lessonMatchesSearch(item, searchQuery, { includeCategory: true })
  );

  const headerBlock = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 sm:h-12 sm:w-12">
          <BookMarked className="size-5 sm:size-6" />
        </div>
        <div className="min-w-0">
          <h1 className="font-serif text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl lg:text-3xl">
            Lesson Library
          </h1>
          <p className="mt-0.5 text-sm text-stone-600">
            Repertoire by category. Add items to reuse when sending lessons.
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={refresh}
        disabled={itemsLoading || categoriesLoading}
        className="h-10 min-h-10 w-full shrink-0 gap-1.5 border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900 sm:w-auto"
      >
        {(itemsLoading || categoriesLoading) ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
        Refresh
      </Button>
    </div>
  );

  const mainContent = (
    <div className="space-y-10">
      <LessonForm 
        categories={categories} 
        onSubmit={addItem} 
        defaultCategory={category}
        formTitle="Add to Library"
        submitLabel="Add to library"
        titleIcon={<Plus className="size-4" />}
      />
      
      <div className="space-y-6">
        <div className="px-2">
          <CategoryTabs 
            categories={categories} 
            loading={categoriesLoading} 
            selectedCategory={category} 
            onSelect={setCategory} 
          />
        </div>

        {category && (
          <div className={`${isPage ? "rounded-[2.5rem] border border-stone-100 bg-white/80 p-6 shadow-xl shadow-stone-200/40 sm:p-10" : ""}`}>
            <div className="mb-8 flex flex-wrap items-center gap-4 border-b border-stone-100 pb-6">
              {renaming ? (
                <div className="flex items-center gap-3">
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    placeholder="Category name"
                    className="h-10 min-w-[280px] border-stone-200 text-sm font-black uppercase tracking-widest"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleRename}
                    disabled={isRenaming || !renameValue.trim()}
                    className="h-10 bg-teal-600 px-6 rounded-xl hover:bg-teal-700"
                  >
                    {isRenaming ? <Loader2 className="size-4 animate-spin" /> : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setRenaming(false)}
                    disabled={isRenaming}
                    className="h-10 px-4 text-stone-400 font-bold uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="group flex items-center gap-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.25em] text-stone-800">
                    {category}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0 text-stone-200 opacity-0 transition-all group-hover:bg-stone-50 group-hover:text-stone-400 group-hover:opacity-100"
                    onClick={() => { setRenameValue(category); setRenaming(true); }}
                    title="Rename category"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {itemsLoading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="size-10 animate-spin text-teal-600/10" />
                <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">Loading Repertoire</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-stone-100 bg-stone-50/30 py-20 px-8 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-stone-100">
                  <FileText className="size-8 text-teal-500/20" />
                </div>
                <p className="mt-6 text-base font-bold text-stone-800">No lessons in &quot;{category}&quot;</p>
                <p className="mt-1 text-sm text-stone-400">Use the form above to add your first lesson.</p>
              </div>
            ) : (
              <>
                <div className="relative mb-8">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-stone-300" />
                  <Input
                    type="search"
                    placeholder={`Search in ${category}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 border-stone-200 bg-white pl-11 shadow-sm transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10"
                  />
                </div>
                
                <ul className="grid gap-5">
                  {filteredItems.map((item) => (
                    <div key={item.id}>
                      {editingItem?.id === item.id ? (
                        <LessonForm
                          categories={categories}
                          initialData={editingItem}
                          onSubmit={async (fd) => {
                            await updateItem(item.id, fd);
                            setEditingItem(null);
                            toast.success("Item updated");
                          }}
                          onCancel={() => setEditingItem(null)}
                          variant="amber"
                          formTitle="Edit Repertoire Item"
                          submitLabel="Save Changes"
                        />
                      ) : (
                        <LibraryItemCard
                          item={item}
                          isExpanded={expandedId === item.id}
                          onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                          onEdit={setEditingItem}
                          onDelete={setDeleteTarget}
                          onSend={setSendTarget}
                        />
                      )}
                    </div>
                  ))}
                  {filteredItems.length === 0 && searchQuery && (
                    <div className="rounded-[2rem] border border-dashed border-stone-200 bg-stone-50/50 py-16 px-8 text-center">
                      <p className="text-sm font-bold text-stone-400 italic">No matches found for your search.</p>
                    </div>
                  )}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (isPage) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-amber-50/40 via-stone-50 to-teal-50/30">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <div className="mb-10">
            {headerBlock}
          </div>
          {mainContent}

          <DeleteDialog 
            item={deleteTarget} 
            onClose={() => setDeleteTarget(null)} 
            onConfirm={async () => {
              if (deleteTarget) {
                await deleteItem(deleteTarget.id);
                toast.success("Item deleted");
                setDeleteTarget(null);
              }
            }}
          />
          <SendToStudentsDialog item={sendTarget} onClose={() => setSendTarget(null)} />
        </div>
      </div>
    );
  }

  return (
    <>
      <Card className="overflow-hidden border-stone-200/80 bg-white/90 shadow-md shadow-stone-200/50 ring-1 ring-stone-200/50">
        <CardHeader className="border-b border-stone-100 bg-stone-50/50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-serif text-xl font-semibold text-stone-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                <BookMarked className="size-4" />
              </span>
              Lesson Library
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={refresh}
              className="gap-1.5 text-stone-500"
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
          </div>
          <p className="text-sm text-stone-500">Repertoire by category. Add items to reuse when sending lessons.</p>
        </CardHeader>
        <CardContent className="pt-6">
          {mainContent}
        </CardContent>
      </Card>

      <DeleteDialog 
        item={deleteTarget} 
        onClose={() => setDeleteTarget(null)} 
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteItem(deleteTarget.id);
            toast.success("Item deleted");
            setDeleteTarget(null);
          }
        }}
      />
      <SendToStudentsDialog item={sendTarget} onClose={() => setSendTarget(null)} />
    </>
  );
}

function DeleteDialog({ 
  item, 
  onClose, 
  onConfirm 
}: { 
  item: LibraryItem | null; 
  onClose: () => void; 
  onConfirm: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <AlertDialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="rounded-[2rem] p-8">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold text-stone-900">Remove from library</AlertDialogTitle>
          <AlertDialogDescription className="text-stone-500">
            Are you sure you want to remove &quot;{item?.title || [item?.raaga, item?.thala].filter(Boolean).join(" · ") || "this item"}&quot;? This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 gap-3">
          <AlertDialogCancel disabled={loading} className="rounded-xl border-stone-200 font-bold">Cancel</AlertDialogCancel>
          <Button 
            variant="destructive" 
            onClick={async () => {
              setLoading(true);
              try {
                await onConfirm();
              } finally {
                setLoading(false);
              }
            }} 
            disabled={loading} 
            className="rounded-xl font-bold"
          >
            {loading ? "Removing…" : "Remove"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
