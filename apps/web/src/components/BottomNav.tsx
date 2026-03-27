"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, Clock } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Trang chủ", icon: Home },
  { href: "/history", label: "Lịch sử", icon: Clock },
  { href: "/accounts", label: "Tài khoản", icon: Wallet },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pt-3 bg-[rgba(15,21,36,0.75)] backdrop-blur-[24px] border-t border-[rgba(125,211,252,0.15)] shadow-[0_-4px_20px_rgba(0,0,0,0.5)] rounded-t-3xl"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center gap-1 px-4 py-1 rounded-xl transition-all active:scale-90 duration-150 ${
              isActive
                ? "text-[#7dd3fc] bg-[rgba(125,211,252,0.1)]"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.5}
              fill={isActive ? "rgba(125,211,252,0.15)" : "none"}
            />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
