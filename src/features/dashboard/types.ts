/** Mirrors evently-BackEnd modules/admin/admin-dashboard.service.ts. */
export interface DashboardSection {
  key: string;
  label: string;
  total: number;
  attention: number;
}

export interface AttentionItem {
  key: string;
  label: string;
  count: number;
  /** Already filtered to exactly what `count` refers to. */
  href: string;
  tone: 'urgent' | 'warn' | 'info';
}

export interface DashboardSummary {
  sections: DashboardSection[];
  attention: AttentionItem[];
  finance: { contractedValue: number; collected: number; outstanding: number };
  generatedAt: string;
}
