/**
 * Mirrors the backend's account model exactly.
 *
 * Source: evently-BackEnd `UserStatus` in modules/user/schemas/user.schema.ts
 * and `Role` in common/enums/role.enum.ts, plus the payloads returned by
 * modules/user/admin-user.service.ts. Nothing here is a state the console
 * invented.
 */
export const USER_STATUSES = ['active', 'suspended'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const USER_ROLES = ['customer', 'organizer', 'vendor', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const STATUS_LABEL: Record<UserStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
};

/** Visual weight, not new meaning — maps onto the existing stylesheet tones. */
export const STATUS_TONE: Record<UserStatus, 'good' | 'bad'> = {
  active: 'good',
  suspended: 'bad',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  customer: 'Customer',
  organizer: 'Organizer',
  vendor: 'Vendor',
  admin: 'Admin',
};

export interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  roles: UserRole[];
  roleLabels: string[];
  status: UserStatus;
  statusLabel: string;
  phoneVerified: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Real counts from the booking, quote and plan collections. */
export interface UserActivity {
  bookings: number;
  quoteRequests: number;
  plans: number;
}

export interface UserDetail extends UserRow {
  activity: UserActivity;
}

export interface Paged<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; pages: number };
}
