/**
 * Admin booking and finance endpoints. Read-only, guarded server-side by
 * `@Roles(Role.ADMIN)` on AdminBookingController / AdminPaymentController.
 */
import { request } from '../../lib/api/client';
import type { Paged } from '../shared/useAdminList';
import type { BookingDetail, BookingRow, PaymentTotals } from './types';

function query(args: {
  search: string;
  page: number;
  limit: number;
  filters: Record<string, string>;
}): string {
  const q = new URLSearchParams();
  if (args.search.trim()) q.set('search', args.search.trim());
  if (args.filters.status) q.set('status', args.filters.status);
  if (args.filters.paymentStatus) q.set('paymentStatus', args.filters.paymentStatus);
  q.set('page', String(args.page));
  q.set('limit', String(args.limit));
  return q.toString();
}

export function listBookings(
  args: { search: string; page: number; limit: number; filters: Record<string, string> },
  signal: AbortSignal,
): Promise<Paged<BookingRow>> {
  return request<Paged<BookingRow>>(`/admin/booking/getBookings?${query(args)}`, { signal });
}

export function bookingCounts(signal: AbortSignal): Promise<Record<string, number>> {
  return request<Record<string, number>>('/admin/booking/getStatusCounts', { signal });
}

export function getBooking(id: string, signal?: AbortSignal): Promise<BookingDetail> {
  return request<BookingDetail>(`/admin/booking/getBookingById/${id}`, signal ? { signal } : {});
}

// ----- finance -----

export function listPayments(
  args: { search: string; page: number; limit: number; filters: Record<string, string> },
  signal: AbortSignal,
): Promise<Paged<BookingRow>> {
  return request<Paged<BookingRow>>(`/admin/payment/getPayments?${query(args)}`, { signal });
}

export function paymentCounts(signal: AbortSignal): Promise<Record<string, number>> {
  return request<Record<string, number>>('/admin/payment/getStatusCounts', { signal });
}

export function paymentTotals(
  args: { search: string; page: number; limit: number; filters: Record<string, string> },
  signal?: AbortSignal,
): Promise<PaymentTotals> {
  return request<PaymentTotals>(
    `/admin/payment/getTotals?${query(args)}`,
    signal ? { signal } : {},
  );
}
