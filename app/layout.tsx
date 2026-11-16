import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AdminShell } from "@/components/admin/AdminShell";
import "./globals.css";
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
export const metadata: Metadata = { title: { default: "ProvPlay Control", template: "%s · ProvPlay Control" }, description: "ProvPlay platform administration and operations console" };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en" className={jakarta.variable}><body><Suspense fallback={children}><AdminShell>{children}</AdminShell></Suspense></body></html>; }
