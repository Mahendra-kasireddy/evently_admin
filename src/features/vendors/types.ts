/**
 * Mirrors evently-BackEnd `SubVendorCategory` / `SubVendorLinkStatus` and the
 * payloads from modules/subvendor/admin-subvendor.service.ts.
 */
export const VENDOR_CATEGORIES = [
  'food', 'water', 'decor', 'photography', 'music', 'transport', 'priest', 'mehendi',
] as const;
export type VendorCategory = (typeof VENDOR_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<VendorCategory, string> = {
  food: 'Food & catering',
  water: 'Water supply',
  decor: 'Decor',
  photography: 'Photography',
  music: 'Music',
  transport: 'Transport',
  priest: 'Priest',
  mehendi: 'Mehendi',
};

export interface VendorRow {
  id: string;
  userId: string;
  fullName: string;
  initials: string;
  avatarColor: string;
  category: VendorCategory;
  categoryLabel: string;
  serviceArea: string;
  baseRate: number;
  baseRateUnit: string;
  minOrder: number;
  active: boolean;
  organizerCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface VendorOrganizerLink {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'removed';
  rating: number | null;
  ratingCount: number;
}

export interface VendorDetail extends VendorRow {
  account: {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    suspended: boolean;
  } | null;
  organizers: VendorOrganizerLink[];
  work: { assigned: number; accepted: number; completed: number; agreedValue: number };
}
