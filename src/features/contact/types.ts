/**
 * Mirrors the backend's contact model exactly.
 *
 * Source: evently-BackEnd `ContactStatus` / `ContactSubject` in
 * modules/contact/schemas/contact-request.schema.ts, and the payloads returned
 * by modules/contact/contact.service.ts. Nothing here is a status the console
 * invented.
 */
export const CONTACT_STATUSES = ['new', 'in_progress', 'responded', 'closed'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const CONTACT_SUBJECTS = [
  'general',
  'event_planning',
  'organizer',
  'booking',
  'billing',
  'technical',
  'other',
] as const;
export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

export const STATUS_LABEL: Record<ContactStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  responded: 'Responded',
  closed: 'Closed',
};

/** Visual weight, not new meaning — maps onto the existing stylesheet tones. */
export const STATUS_TONE: Record<ContactStatus, 'wait' | 'work' | 'review' | 'good' | 'bad'> = {
  new: 'wait',
  in_progress: 'work',
  responded: 'good',
  closed: 'review',
};

export const SUBJECT_LABEL: Record<ContactSubject, string> = {
  general: 'General enquiry',
  event_planning: 'Event planning',
  organizer: 'Organizer',
  booking: 'Booking',
  billing: 'Payment / Billing',
  technical: 'Technical issue',
  other: 'Other',
};

export interface ContactRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: ContactSubject;
  subjectLabel: string;
  status: ContactStatus;
  statusLabel: string;
  /** True when the sender had no Evently account. */
  isGuest: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactDetail extends ContactRow {
  message: string;
  response: string;
  respondedAt: string | null;
  /** Whether the reply was actually emailed — false while no provider is set. */
  responseEmailed: boolean;
  respondedBy: string | null;
}

export interface Paged<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; pages: number };
}
