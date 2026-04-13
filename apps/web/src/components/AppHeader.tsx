"use client";

import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface AppHeaderProps {
	showBack?: boolean;
	backHref?: string;
}

export default function AppHeader({ showBack, backHref }: AppHeaderProps) {
	const router = useRouter();
	const { user, logout } = useAuth();

	const handleBack = () => {
		if (backHref) router.push(backHref);
		else router.back();
	};

	const initials = user?.name
		? user.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "GP";

	return (
		<header className="fixed top-0 left-0 right-0 z-50 bg-[rgba(10,14,26,0.6)] backdrop-blur-xl border-b border-[rgba(125,211,252,0.1)] shadow-[0_0_30px_rgba(125,211,252,0.05)]">
			<div
				className="flex justify-between items-center h-16 px-6"
				style={{
					paddingTop: "env(safe-area-inset-top)",
					height: "calc(4rem + env(safe-area-inset-top))",
				}}>
				<div className="flex items-center gap-3">
					{showBack ? (
						<button
							onClick={handleBack}
							className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[rgba(125,211,252,0.1)] transition-colors text-[#e0e8f0] active:scale-95"
							aria-label="Go back">
							<ArrowLeft size={20} />
						</button>
					) : (
						<div className="w-8 h-8 rounded-full overflow-hidden border border-[rgba(125,211,252,0.3)] bg-[#141c2e] flex items-center justify-center text-xs font-bold text-[#7dd3fc]">
							{initials}
						</div>
					)}
					<span className="text-xl font-bold text-[#7dd3fc] drop-shadow-[0_0_10px_rgba(125,211,252,0.3)] tracking-tight">
						HaJia
					</span>
				</div>
				<div className="flex items-center gap-1">
					<span className="text-xs text-[#fff] font-medium mr-1 sm:block">
						Xin chào, {user?.name}
					</span>
					{/* <button
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[rgba(125,211,252,0.1)] transition-colors text-[#a0b4c4] active:scale-95"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button> */}
					{user && (
						<button
							onClick={logout}
							className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-500/10 transition-colors text-[#a0b4c4] hover:text-red-400 active:scale-95"
							aria-label="Logout">
							<LogOut size={18} />
						</button>
					)}
				</div>
			</div>
		</header>
	);
}
