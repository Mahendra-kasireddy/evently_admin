/** Mirrors evently-BackEnd/src/modules/metadata (MetadataService views). */

export type FieldKind = 'text' | 'number' | 'boolean' | 'list' | 'select';

export interface FieldSpec {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  maxLength?: number;
  options?: string[];
  hint?: string;
}

export interface MetadataType {
  type: string;
  label: string;
  group: string;
  /** The natural key other records refer to: set once, never edited. */
  keyField: string;
  keyIsSlug: boolean;
  fields: FieldSpec[];
}

export interface MetadataItem {
  id: string;
  key: string;
  order: number;
  active: boolean;
  imageUrl: string;
  values: Record<string, unknown>;
}

export type ContentKey = 'customer-home' | 'customer-plan';

export interface ContentDoc {
  key: ContentKey;
  label: string;
  /** False while the app is showing the built-in default (nothing saved yet). */
  saved: boolean;
  data: Record<string, unknown>;
  updatedAt: string | null;
}

export interface MetadataCatalog {
  types: MetadataType[];
  content: Array<{ key: ContentKey; label: string }>;
}
