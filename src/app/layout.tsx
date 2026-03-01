import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { AppNav } from "@/components/app-nav";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  variable: "--font-instrument-serif",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sumadhwa Swaradhuri - Carnatic Music",
  description: "Learn Carnatic music with your teacher",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${instrumentSerif.variable} ${inter.variable}`} suppressHydrationWarning>
        <body
          className="min-h-screen bg-stone-50 font-sans antialiased text-stone-800"
          suppressHydrationWarning
        >
          <AppNav />
          <main>{children}</main>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
