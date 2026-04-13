"use client";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { AuthProvider } from "@/lib/auth-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<AuthProvider>
			<div className="min-h-screen bg-glacier-bg">
				<AppHeader />
				<main className="pt-header pb-nav px-5 max-w-lg mx-auto">
					{children}
				</main>
				<BottomNav />
			</div>
		</AuthProvider>
	);
}
