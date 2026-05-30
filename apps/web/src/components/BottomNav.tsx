"use client";

import { Clock, Home, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
	{ href: "/history", label: "Lịch sử", icon: Clock },
	{ href: "/dashboard", label: "Trang chủ", icon: Home },
	{ href: "/accounts", label: "Tài khoản", icon: Wallet },
];

export default function BottomNav() {
	const pathname = usePathname();

	return (
		<nav
			className="fixed bottom-0 left-1/2 transform -translate-x-1/2 mx-auto max-w-max z-50 flex justify-around items-center px-2 py-1 bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] rounded-3xl mg-safe-bottom"
      >
			{navItems.map(({ href, label, icon: Icon }) => {
				const isActive =
					pathname === href || pathname.startsWith(href + "/");
				return (
					<Link
						key={href}
						href={href}
						className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-3xl transition-all active:scale-90 duration-150 min-w-20 ${
							isActive
								? "text-glacier-on-surface bg-black"
								: "text-slate-500 hover:text-slate-300"
						}`}>
						<Icon
							size={22}
							strokeWidth={isActive ? 2.5 : 1.5}
						/>
					</Link>
				);
			})}
		</nav>
	);
}
