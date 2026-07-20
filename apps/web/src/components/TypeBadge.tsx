"use client";

interface TypeBadgeProps {
	type: string;
	label: string;
}

const typeStyles: Record<string, string> = {
	gold: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
	stock: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
	keyboard: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function TypeBadge({ type, label }: TypeBadgeProps) {
	const colorStyle =
		typeStyles[type] ||
		"bg-white/10 text-glacier-on-surface-variant border-white/10";

	return (
		<span
			className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide relative overflow-hidden before:absolute before:inset-0 before:translate-x-[-100%] before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent ${colorStyle}`}>
			{label}
		</span>
	);
}
