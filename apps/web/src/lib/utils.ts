export function formatCurrency(
	amount: number,
	showCurrency = true,
): string {
	return new Intl.NumberFormat("vi-VN", {
		style: showCurrency ? "currency" : "decimal",
		currency: showCurrency ? "VND" : undefined,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

export function formatDate(date: Date | string): string {
	return new Intl.DateTimeFormat("vi-VN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(new Date(date));
}

export function formatDateGroup(date: Date | string): string {
	const d = new Date(date);
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(today.getDate() - 1);

	if (d.toDateString() === today.toDateString()) return "Hôm nay";
	if (d.toDateString() === yesterday.toDateString()) return "Hôm qua";

	return new Intl.DateTimeFormat("vi-VN", {
		month: "short",
		day: "numeric",
	}).format(d);
}
