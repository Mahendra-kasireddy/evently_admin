/** Mirrors `CouponView` / `RedemptionView` on the Nest side. */

export type CouponScope = 'platform' | 'organizer';
export type CouponDiscountType = 'percentage' | 'fixed';
export type CouponStatus = 'active' | 'disabled';
export type RedemptionStatus = 'redeemed' | 'reversed';

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  scope: CouponScope;
  organizerId: string | null;
  organizerName: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscount: number;
  minBookingAmount: number;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number;
  perCustomerLimit: number;
  usedCount: number;
  status: CouponStatus;
  createdByRole: string;
  createdAt: string | null;
}

export interface Redemption {
  id: string;
  code: string;
  customerName: string;
  bookingRef: string;
  organizerName: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: RedemptionStatus;
  redeemedAt: string | null;
}

/** What a create or edit sends. Only the terms — never scope or ownership. */
export interface CouponTerms {
  code: string;
  title: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscount: number;
  minBookingAmount: number;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number;
  perCustomerLimit: number;
}

export const SCOPE_LABEL: Record<CouponScope, string> = {
  platform: 'Platform',
  organizer: 'Organizer',
};

/** How a coupon's terms read in one line, in the list. */
export function discountLabel(coupon: Pick<Coupon, 'discountType' | 'discountValue' | 'maxDiscount'>): string {
  if (coupon.discountType === 'fixed') return `₹${coupon.discountValue.toLocaleString('en-IN')} off`;
  const cap = coupon.maxDiscount > 0 ? ` (max ₹${coupon.maxDiscount.toLocaleString('en-IN')})` : '';
  return `${coupon.discountValue}% off${cap}`;
}

/**
 * How much of the coupon is left.
 *
 * An unlimited coupon says how many have gone rather than pretending to a
 * denominator it does not have.
 */
export function usageLabel(coupon: Pick<Coupon, 'usedCount' | 'usageLimit'>): string {
  return coupon.usageLimit > 0
    ? `${coupon.usedCount} / ${coupon.usageLimit}`
    : `${coupon.usedCount}`;
}
