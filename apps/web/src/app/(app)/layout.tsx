"use client";
import { AuthProvider } from "@/lib/auth-context";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#0a0e1a]">
        <AppHeader />
        <main className="pt-20 pb-28 px-5 max-w-lg mx-auto">{children}</main>
        <BottomNav />
      </div>
    </AuthProvider>
  );
}
