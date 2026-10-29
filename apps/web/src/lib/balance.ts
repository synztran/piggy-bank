import type { IPaymentSource } from "@/models/User";

/**
 * The user's total money is the sum of every non-credit payment source
 * balance. Credit cards are liabilities tracked through `debt`, so their
 * balance is never part of the main total.
 */
export function totalBalance(
	paymentSources: IPaymentSource[] | undefined | null,
): number {
	if (!paymentSources?.length) return 0;
	return paymentSources.reduce((sum, source) => {
		if (source.type === "Credit") return sum;
		return sum + (Number(source.balance) || 0);
	}, 0);
}
