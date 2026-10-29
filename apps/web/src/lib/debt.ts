import type { IPaymentSource } from "@/models/User";

export type DebtStatus =
	| "overdue"
	| "due-today"
	| "due-soon"
	| "upcoming"
	| "no-due-date"
	| "paid";

export interface CreditDebtInfo {
	id: string;
	name: string;
	lastFourDigits?: string;
	debt: number;
	dueDay: number | null;
	/** Due date for the current payment cycle, formatted as YYYY-MM-DD. */
	dueDate: string | null;
	/** Negative when overdue, 0 on the due date. */
	daysUntilDue: number | null;
	status: DebtStatus;
}

const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";
const DAY_MS = 24 * 60 * 60 * 1000;
const DUE_SOON_DAYS = 3;

interface TodayParts {
	year: number;
	month: number;
	day: number;
	utc: number;
}

function pad(value: number): string {
	return String(value).padStart(2, "0");
}

function todayInVietnam(now: Date): TodayParts {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: VN_TIME_ZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(now);

	const read = (type: Intl.DateTimeFormatPartTypes) =>
		Number(parts.find((part) => part.type === type)?.value);

	const year = read("year");
	const month = read("month");
	const day = read("day");

	return {
		year,
		month,
		day,
		utc: Date.UTC(year, month - 1, day),
	};
}

function daysInMonth(year: number, monthIndex: number): number {
	return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * Builds the current payment-cycle deadline for a monthly due day.
 * Due day 29-31 is clamped to the last day of short months.
 */
function currentCycleDueDate(
	dueDay: number,
	today: TodayParts,
): { date: string; daysUntilDue: number } {
	const day = Math.min(
		dueDay,
		daysInMonth(today.year, today.month - 1),
	);
	const dueUtc = Date.UTC(today.year, today.month - 1, day);

	return {
		date: `${today.year}-${pad(today.month)}-${pad(day)}`,
		daysUntilDue: Math.round((dueUtc - today.utc) / DAY_MS),
	};
}

export function getCreditDebtInfo(
	source: Pick<
		IPaymentSource,
		"id" | "name" | "last4Digits" | "debt" | "dueDay"
	>,
	now: Date = new Date(),
): CreditDebtInfo {
	const debt = Math.max(0, Number(source.debt) || 0);
	const rawDueDay = Number(source.dueDay);
	const dueDay =
		Number.isInteger(rawDueDay) && rawDueDay >= 1 && rawDueDay <= 31
			? rawDueDay
			: null;

	const base = {
		id: source.id,
		name: source.name,
		lastFourDigits: source.last4Digits,
		debt,
		dueDay,
		dueDate: null,
		daysUntilDue: null,
	} satisfies Omit<CreditDebtInfo, "status">;

	if (debt <= 0) {
		return { ...base, status: "paid" };
	}

	if (dueDay === null) {
		return { ...base, status: "no-due-date" };
	}

	const { date, daysUntilDue } = currentCycleDueDate(
		dueDay,
		todayInVietnam(now),
	);

	let status: DebtStatus;
	if (daysUntilDue < 0) status = "overdue";
	else if (daysUntilDue === 0) status = "due-today";
	else if (daysUntilDue <= DUE_SOON_DAYS) status = "due-soon";
	else status = "upcoming";

	return {
		...base,
		dueDate: date,
		daysUntilDue,
		status,
	};
}

export function buildCreditDebts(
	sources: IPaymentSource[] | undefined | null,
	now: Date = new Date(),
): CreditDebtInfo[] {
	if (!sources?.length) return [];
	return sources
		.filter((source) => source.type === "Credit")
		.map((source) => getCreditDebtInfo(source, now));
}

/** Total credit-card debt; never included in the main balance. */
export function totalDebt(
	sources: IPaymentSource[] | undefined | null,
): number {
	return buildCreditDebts(sources).reduce(
		(sum, debt) => sum + debt.debt,
		0,
	);
}

function shortDate(isoDate: string): string {
	const [, month, day] = isoDate.split("-");
	return `${day}/${month}`;
}

export function dueStatusLabel(debt: CreditDebtInfo): string {
	if (debt.status === "paid") return "Không có dư nợ";
	if (debt.status === "no-due-date" || !debt.dueDate) {
		return "Chưa đặt hạn trả";
	}

	const date = shortDate(debt.dueDate);
	const days = debt.daysUntilDue ?? 0;

	if (debt.status === "overdue") {
		return `Quá hạn ${Math.abs(days)} ngày · ${date}`;
	}
	if (debt.status === "due-today") {
		return `Đến hạn hôm nay · ${date}`;
	}
	return `Còn ${days} ngày · ${date}`;
}
