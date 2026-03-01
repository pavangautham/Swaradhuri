"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { Menu, X, LayoutDashboard, Users, BookMarked, Music, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";

export function AppNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const meta = user?.publicMetadata as { role?: string } | undefined;

  // Close menu when pathname changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const teacherLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/students", label: "Students", icon: Users },
    { href: "/dashboard/library", label: "Library", icon: BookMarked },
  ];

  const studentLinks = [
    { href: "/lessons", label: "Lessons", icon: Music },
    { href: "/instructions", label: "Instructions", icon: Info },
  ];

  const links = (meta?.role === "teacher" || meta?.role === "teacher_admin") 
    ? teacherLinks 
    : meta?.role === "student" 
      ? studentLinks 
      : [];

  return (
    <header className="sticky top-0 z-50 border-b border-stone-100 bg-white/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all md:hidden ${
              isMenuOpen ? "bg-stone-100 text-stone-900" : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
            }`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <Link href="/" className="font-serif text-lg font-bold tracking-tight text-stone-900 sm:text-xl">
            Sumadhwa Swaradhuri
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${
                  isActive
                    ? "bg-teal-50 text-teal-700 shadow-sm shadow-teal-900/5 ring-1 ring-teal-200/50"
                    : "text-stone-400 hover:bg-stone-50 hover:text-stone-800"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-9 w-9 rounded-xl shadow-sm ring-1 ring-stone-200/50",
              },
            }}
          />
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 top-[65px] z-40 bg-stone-900/40 backdrop-blur-md animate-in fade-in duration-300 md:hidden" 
          onClick={() => setIsMenuOpen(false)}
        >
          <div 
            className="absolute left-0 top-0 h-[calc(100vh-65px)] w-full overflow-y-auto bg-white p-6 shadow-2xl animate-in slide-in-from-top-4 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 px-1">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400">Main Menu</p>
            </div>
            <div className="grid gap-4">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-5 rounded-[2rem] p-5 transition-all duration-300 ${
                      isActive 
                        ? "bg-teal-600 text-white shadow-2xl shadow-teal-900/20" 
                        : "bg-stone-50 text-stone-600 hover:bg-stone-100 active:scale-[0.98]"
                    }`}
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-500 ${
                      isActive 
                        ? "bg-white/20 text-white" 
                        : "bg-white text-stone-300 shadow-sm"
                    }`}>
                      <Icon className="size-6" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-base font-black uppercase tracking-[0.1em]">{link.label}</span>
                      {isActive && <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Active Now</span>}
                    </div>
                    {isActive && (
                      <div className="ml-auto h-2.5 w-2.5 rounded-full bg-white shadow-lg shadow-white/20 animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="mt-12 flex flex-col items-center gap-3 border-t border-stone-50 pt-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Music className="size-6" />
              </div>
              <p className="font-serif text-lg font-bold text-stone-900 italic">Sumadhwa Swaradhuri</p>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">Sangeetha Seva • 2026</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
