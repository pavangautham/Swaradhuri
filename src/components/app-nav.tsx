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
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <button
            className="p-2 text-stone-600 hover:text-stone-900 md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
          <Link href="/" className="font-serif text-xl font-bold text-stone-800">
            Sumadhwa Swaradhuri
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href))
                  ? "text-teal-600"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-9 w-9",
              },
            }}
          />
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-stone-900/20 backdrop-blur-sm md:hidden" onClick={() => setIsMenuOpen(false)}>
          <div 
            className="absolute left-0 top-0 h-auto w-full border-b border-stone-200 bg-white p-6 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid gap-4">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-4 rounded-2xl p-4 transition-all ${
                      isActive 
                        ? "bg-teal-50 text-teal-700 shadow-sm ring-1 ring-teal-200" 
                        : "bg-stone-50 text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive ? "bg-teal-600 text-white shadow-lg shadow-teal-900/10" : "bg-white text-stone-400 shadow-sm"}`}>
                      <Icon className="size-5" />
                    </div>
                    <span className="text-base font-bold uppercase tracking-widest">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
