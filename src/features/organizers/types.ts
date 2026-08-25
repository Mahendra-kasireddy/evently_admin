/**
 * Mirrors the backend's organizer lifecycle exactly.
 *
 * Source: evently-BackEnd `OnboardingStatus` in
 * modules/organizer/schemas/organizer-profile.schema.ts, and the payloads
 * returned by modules/organizer/admin-organizer.service.ts. Nothing here is a
 * status the admin console invented — the console can only show states the
 * domain model actually has.
 */
export const ORGANIZER_STATUSES = [
  'pending_review',
  'draft',
  'in_progress',
  'submitted',
  'changes_requested',
  'approved',
  'rejected',
] as const;

export type OrganizerStatus = (typeof ORGANIZER_STATUSES)[number];

/** Short labels for chips and pills. `LABELS` on the backend is prose. */
export const STATUS_LABEL: Record<OrganizerStatus, string> = {
  pending_review: 'Pending review',
  draft: 'Approved to onboard',
  in_progress: 'Onboarding',
  submitted: 'Submitted',
  changes_requested: 'Changes requested',
  approved: 'Active',
  rejected: 'Rejected',
};

/** Visual weight, not new meaning — maps onto the tokens in the stylesheet. */
export const STATUS_TONE: Record<OrganizerStatus, 'wait' | 'work' | 'review' | 'good' | 'bad'> = {
  pending_review: 'wait',
  draft: 'work',
  in_progress: 'work',
  submitted: 'review',
  changes_requested: 'wait',
  approved: 'good',
  rejected: 'bad',
};

export interface OrganizerRow {
  id: string;
  userId: string;
  businessName: string;
  contactName: string;
  mobile: string;
  city: string;
  status: OrganizerStatus;
  statusLabel: string;
  profileCompletion: number;
  registeredAt: string;
  submittedAt: string | null;
  live: boolean;
}

export interface Paged<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export interface FileRef {
  url: string;
  key: string;
  originalName: string;
}

/** The organizer's own onboarding view, rendered unchanged by the console. */
export interface OnboardingView {
  id: string;
  onboardingStatus: OrganizerStatus;
  profileCompletion: number;
  submittedAt: string | null;
  canEdit: boolean;
  reviewNote: string;
  firstName: string;
  lastName: string;
  contactEmail: string;
  mobile: string;
  businessName: string;
  displayName: string;
  businessType: string;
  primaryCategory: string;
  city: string;
  profilePhoto: FileRef | null;
  aadhaarNumber: string;
  panNumber: string;
  gstNumber: string;
  businessRegNumber: string;
  governmentIdType: string;
  governmentIdFile: FileRef | null;
  panFile: FileRef | null;
  gstFile: FileRef | null;
  businessRegFile: FileRef | null;
  accountHolderName: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
  cancelledChequeFile: FileRef | null;
  experience: string;
  teamSize: string;
  languages: string[];
  secondaryCategories: string[];
  servicesOffered: string[];
  occasions: string[];
  serviceRadius: number;
  travelOption: string;
  paymentMethods: string[];
  workingDays: string[];
  workingHoursStart: string;
  workingHoursEnd: string;
  minBudget: number;
  maxBudget: number;
  advancePercentage: number;
  emergencyAvailability: boolean;
  destinationEvents: boolean;
  internationalEvents: boolean;
  tagline: string;
  businessDescription: string;
  yearsOfExperience: number;
  featuredProjects: string[];
  instagram: string;
  facebook: string;
  youtube: string;
  website: string;
  linkedin: string;
  coverPhoto: FileRef | null;
  gallery: FileRef[];
  videos: FileRef[];
  certificates: FileRef[];
  awards: FileRef[];
}

export interface OnboardingStep {
  id: string;
  title: string;
  complete: boolean;
  missingFields: string[];
}

export type ReviewAction =
  | 'registered'
  | 'admitted'
  | 'submitted'
  | 'changes_requested'
  | 'approved'
  | 'rejected'
  | 'admin_edit'
  | 'reopened';

export interface ReviewTrailEntry {
  action: ReviewAction;
  fromStatus: OrganizerStatus;
  toStatus: OrganizerStatus;
  reason: string;
  actorRole: 'organizer' | 'admin';
  actorName: string;
  fields: string[];
  at: string;
}

export const ACTION_LABEL: Record<ReviewAction, string> = {
  registered: 'Registered',
  admitted: 'Registration approved',
  submitted: 'Submitted for review',
  changes_requested: 'Changes requested',
  approved: 'Profile approved',
  rejected: 'Rejected',
  admin_edit: 'Edited by admin',
  reopened: 'Reopened',
};

export interface OrganizerDetail extends OrganizerRow {
  email: string;
  accountRoles: string[];
  accountStatus: string | null;
  onboarding: OnboardingView;
  steps: OnboardingStep[];
  missingFields: string[];
  canOrganizerEdit: boolean;
  canAdminEdit: boolean;
  reviewTrail: ReviewTrailEntry[];
}

/**
 * The only onboarding fields an admin may write.
 *
 * Deliberately excludes verification (Aadhaar/PAN/GST + documents) and bank
 * details: the backend's AdminUpdateOnboardingDto refuses them, and an admin
 * typing another person's identity or bank data is a fraud vector. This list is
 * the UI's half of that rule — the enforcement is server-side.
 */
export const ADMIN_EDITABLE = [
  { key: 'firstName', label: 'First name', kind: 'text' },
  { key: 'lastName', label: 'Last name', kind: 'text' },
  { key: 'contactEmail', label: 'Email', kind: 'text' },
  { key: 'businessName', label: 'Business name', kind: 'text' },
  { key: 'displayName', label: 'Display name', kind: 'text' },
  { key: 'businessType', label: 'Business type', kind: 'text' },
  { key: 'primaryCategory', label: 'Primary category', kind: 'text' },
  { key: 'city', label: 'City', kind: 'text' },
  { key: 'experience', label: 'Experience', kind: 'text' },
  { key: 'teamSize', label: 'Team size', kind: 'text' },
  { key: 'travelOption', label: 'Travel option', kind: 'text' },
  { key: 'minBudget', label: 'Minimum budget', kind: 'number' },
  { key: 'maxBudget', label: 'Maximum budget', kind: 'number' },
  { key: 'tagline', label: 'Tagline', kind: 'text' },
  { key: 'businessDescription', label: 'Business description', kind: 'textarea' },
  { key: 'website', label: 'Website', kind: 'text' },
] as const satisfies ReadonlyArray<{ key: keyof OnboardingView; label: string; kind: string }>;

export type AdminEditableKey = (typeof ADMIN_EDITABLE)[number]['key'];
