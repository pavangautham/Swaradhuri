"use client";

import { useEffect } from "react";
import { Loader2, UserMinus } from "lucide-react";
import { useClerk } from "@clerk/nextjs";

export default function RemovedPage() {
  const { signOut } = useClerk();

  useEffect(() => {
    signOut?.({ redirectUrl: "/" });
  }, [signOut]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-gradient-to-b from-stone-50 via-stone-100 to-stone-50 px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center animate-in fade-in zoom-in-95 duration-500">
        <h1 className="font-serif text-4xl font-bold tracking-tight text-stone-300">
          Sumadhwa Swaradhuri
        </h1>
        
        <div className="relative overflow-hidden rounded-[2.5rem] border border-stone-200/60 bg-white/80 p-8 shadow-2xl shadow-stone-200/40 backdrop-blur-xl sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 mb-6 shadow-inner ring-1 ring-stone-200/50">
            <UserMinus className="size-8" />
          </div>
          
          <h2 className="text-xl font-bold text-stone-800">Class Access Removed</h2>
          <p className="mt-3 text-sm font-medium leading-relaxed text-stone-500">
            Your teacher has removed you from their active student list. You no longer have access to these lessons.
          </p>
          
          <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl bg-stone-50 py-3 px-4">
            <Loader2 className="size-4 animate-spin text-stone-400" />
            <span className="text-xs font-black uppercase tracking-widest text-stone-400">Signing you out...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
