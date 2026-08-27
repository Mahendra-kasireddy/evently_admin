/** Mirrors evently-BackEnd `QuoteRequestStatus` and admin-event.service.ts. */
export const EVENT_STATUSES = ['open', 'quoted', 'accepted', 'cancelled', 'closed'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  open: 'Awaiting quotes',
  quoted: 'Quotes received',
  accepted: 'Quote accepted',
  cancelled: 'Cancelled',
  closed: 'Closed',
};

export const EVENT_STATUS_TONE: Record<EventStatus, 'wait' | 'work' | 'review' | 'good' | 'bad'> = {
  open: 'wait',
  quoted: 'review',
  accepted: 'good',
  cancelled: 'bad',
  closed: 'work',
};

export interface EventCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface EventRow {
  id: string;
  occasion: string;
  when: string;
  where: string;
  guests: string;
  status: EventStatus;
  statusLabel: string;
  customer: EventCustomer | null;
  targetedOrganizer: string | null;
  quoteCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface EventQuote {
  id: string;
  organizerName: string;
  organizerTier: string;
  status: string;
  grandTotal: number;
  advancePercentage: number;
  sentAt: string | null;
}

export interface EventDetail extends EventRow {
  budget: string;
  categories: string[];
  ideas: string;
  quotes: EventQuote[];
  booking: { id: string; ref: string; status: string; amount: number } | null;
}
