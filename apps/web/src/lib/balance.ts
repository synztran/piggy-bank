import type { IPaymentSource } from "@/models/User";

/**
 * The user's total money is the sum of every payment source balance.
 * This is the single source of truth — there is no separate running counter.
 */
export function totalBalance(
	paymentSources: IPaymentSource[] | undefined | null,
): number {
	if (!paymentSources?.length) return 0;
	return paymentSources.reduce(
		(sum, source) => sum + (Number(source.balance) || 0),
		0,
	);
}
