/**
 * Mirrors evently-BackEnd `BookingStatus` / `PaymentStatus` and the payloads
 * from modules/booking/admin-booking.service.ts.
 *
 * The two are separate axes on purpose — a booking can have its advance paid
 * while still awaiting the organizer, and folding them into one label is what
 * made the customer-facing screen say "Pending" to someone who had just been
 * charged.
 */
export const BOOKING_STATUSES = [
  'pending', 'awaiting_organizer', 'confirmed', 'in_progress',
  'completed', 'cancelled', 'rejected', 'expired',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_STATUSES = ['unpaid', 'advance_paid', 'paid_in_full'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Booking placed',
  awaiting_organizer: 'Awaiting organizer',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Declined',
  expired: 'Expired',
};

export const BOOKING_STATUS_TONE: Record<
  BookingStatus,
  'wait' | 'work' | 'review' | 'good' | 'bad'
> = {
  pending: 'wait',
  awaiting_organizer: 'wait',
  confirmed: 'good',
  in_progress: 'review',
  completed: 'work',
  cancelled: 'bad',
  rejected: 'bad',
  expired: 'bad',
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  advance_paid: 'Advance paid',
  paid_in_full: 'Paid in full',
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, 'wait' | 'work' | 'good' | 'bad'> = {
  unpaid: 'bad',
  advance_paid: 'wait',
  paid_in_full: 'good',
};

export interface BookingParty {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface BookingRow {
  id: string;
  ref: string;
  title: string;
  occasion: string;
  location: string;
  eventDate: string | null;
  status: BookingStatus;
  statusLabel: string;
  paymentStatus: PaymentStatus;
  paymentStatusLabel: string;
  amount: number;
  advancePercentage: number;
  advanceAmount: number;
  amountPaid: number;
  outstanding: number;
  advancePaidAt: string | null;
  customer: BookingParty | null;
  organizer: BookingParty | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BookingTimelineEntry {
  status: string;
  label: string;
  note?: string;
  at?: string;
}

export interface BookingDetail extends BookingRow {
  description: string;
  progress: number;
  steps: Array<{ label: string; done: boolean }>;
  timeline: BookingTimelineEntry[];
  declineReason: string;
  organizerRespondBy: string | null;
  tasks: Array<{
    title: string;
    status: string;
    assigneeName: string;
    assignmentStatus: string;
    amount: number;
  }>;
}

/** Summed across the whole filtered slice, not just the visible page. */
export interface PaymentTotals {
  bookings: number;
  contractedValue: number;
  collected: number;
  outstanding: number;
}
