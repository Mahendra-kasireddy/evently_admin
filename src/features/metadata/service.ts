/**
 * App setup endpoints (admin/metadata), all guarded server-side by
 * `@Roles(Role.ADMIN)` on AdminMetadataController. The server validates every
 * field against the type's definition; the console only shapes the input.
 */
import { request } from '../../lib/api/client';
import type { ContentDoc, ContentKey, MetadataCatalog, MetadataItem } from './types';

export function getCatalog(signal?: AbortSignal): Promise<MetadataCatalog> {
  return request<MetadataCatalog>('/admin/metadata/types', signal ? { signal } : {});
}

export function listItems(type: string, signal?: AbortSignal): Promise<MetadataItem[]> {
  return request<MetadataItem[]>(`/admin/metadata/${type}`, signal ? { signal } : {});
}

export function createItem(type: string, body: Record<string, unknown>): Promise<MetadataItem> {
  return request<MetadataItem>(`/admin/metadata/${type}`, { method: 'POST', body });
}

export function updateItem(
  type: string,
  id: string,
  body: Record<string, unknown>,
): Promise<MetadataItem> {
  return request<MetadataItem>(`/admin/metadata/${type}/${id}`, { method: 'PATCH', body });
}

export function listContent(signal?: AbortSignal): Promise<ContentDoc[]> {
  return request<ContentDoc[]>('/admin/metadata/content', signal ? { signal } : {});
}

export function saveContent(key: ContentKey, data: unknown): Promise<ContentDoc> {
  return request<ContentDoc>(`/admin/metadata/content/${key}`, { method: 'PUT', body: { data } });
}

export function resetContent(key: ContentKey): Promise<ContentDoc> {
  return request<ContentDoc>(`/admin/metadata/content/${key}/reset`, { method: 'POST' });
}
