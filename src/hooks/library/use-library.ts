import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { LibraryItem, Category } from "@/types/music";

export function useLibrary() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [category, setCategory] = useState<string>("");
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetch("/api/library/categories", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setCategories(list);
        return list;
      }
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setCategoriesLoading(false);
    }
    return [];
  }, []);

  const fetchItems = useCallback(async (cat: string) => {
    if (!cat) {
      setItems([]);
      setItemsLoading(false);
      return;
    }
    setItemsLoading(true);
    try {
      const res = await fetch(`/api/library?category=${encodeURIComponent(cat)}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      toast.error("Failed to load library items");
    } finally {
      setItemsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (category) {
      fetchItems(category);
    }
  }, [category, fetchItems]);

  useEffect(() => {
    if (!categoriesLoading && categories.length > 0 && !category) {
      setCategory(categories[0].name);
    }
  }, [categoriesLoading, categories, category]);

  const addItem = async (formData: FormData) => {
    const res = await fetch("/api/library", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error ?? "Failed to add item");
    }
    await fetchCategories();
    if (category === formData.get("category")) {
      await fetchItems(category);
    } else {
      setCategory(formData.get("category") as string);
    }
    return data;
  };

  const updateItem = async (id: string, formData: FormData | object) => {
    const isFormData = formData instanceof FormData;
    const res = await fetch(`/api/library/${id}`, {
      method: "PATCH",
      headers: isFormData ? {} : { "Content-Type": "application/json" },
      body: isFormData ? (formData as FormData) : JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error ?? "Failed to update item");
    }
    await fetchCategories();
    if (category) await fetchItems(category);
    return data;
  };

  const deleteItem = async (id: string) => {
    const res = await fetch(`/api/library/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data?.error ?? "Failed to delete item");
    }
    await fetchCategories();
    if (category) await fetchItems(category);
  };

  const renameCategory = async (oldName: string, newName: string) => {
    const res = await fetch("/api/library/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentName: oldName, newName }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error ?? "Failed to rename category");
    }
    await fetchCategories();
    setCategory(newName);
    return data;
  };

  return {
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
    refresh: () => { fetchCategories(); if (category) fetchItems(category); },
  };
}
