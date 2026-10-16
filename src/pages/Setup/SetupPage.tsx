import { useEffect, useState } from 'react';
import { ListError, ListHead, Pill } from '../../features/shared/ListChrome';
import {
  createItem,
  getCatalog,
  listContent,
  listItems,
  updateItem,
} from '../../features/metadata/service';
import type {
  ContentDoc,
  ContentKey,
  MetadataCatalog,
  MetadataItem,
  MetadataType,
} from '../../features/metadata/types';
import { errorMessage } from '../../lib/api/errors';
import { ContentEditor } from './ContentEditor';
import { ItemForm } from './ItemForm';
import list from '../../features/organizers/organizers.module.css';
import detail from '../Organizers/detail.module.css';
import setup from './setup.module.css';

type Section = { kind: 'type'; type: string } | { kind: 'content'; key: ContentKey };

/**
 * App setup — the data every screen is built from: the occasions, cities,
 * service categories and ranges the planner offers, the options organizer
 * registration offers, and the Home/Plan copy.
 *
 * Options are never deleted from here. Organizers, plans and bookings already
 * store their keys, so an option is retired by deactivating it: it disappears
 * from new choices and everything that already names it keeps working.
 */
export function SetupPage() {
  const [catalog, setCatalog] = useState<MetadataCatalog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [section, setSection] = useState<Section>({ kind: 'type', type: 'occasions' });

  useEffect(() => {
    const controller = new AbortController();
    getCatalog(controller.signal)
      .then((found) => {
        if (!controller.signal.aborted) setCatalog(found);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setLoadError(errorMessage(cause));
      });
    return () => controller.abort();
  }, []);

  const groups = catalog
    ? [...new Set(catalog.types.map((t) => t.group))].map((group) => ({
        group,
        types: catalog.types.filter((t) => t.group === group),
      }))
    : [];
  const activeType =
    section.kind === 'type' ? catalog?.types.find((t) => t.type === section.type) : undefined;

  return (
    <div>
      <ListHead
        eyebrow="App setup"
        title="App setup"
        subtitle="The options and copy every screen is built from. Changes show in the apps straight away."
      />
      <ListError error={loadError} />

      {catalog ? (
        <div className={setup.layout}>
          <nav className={setup.nav} aria-label="Setup sections">
            {groups.map(({ group, types }) => (
              <div key={group} className={setup.navGroup}>
                <p className={setup.navTitle}>{group}</p>
                {types.map((t) => (
                  <button
                    key={t.type}
                    type="button"
                    className={`${setup.navItem} ${
                      section.kind === 'type' && section.type === t.type ? setup.navOn : ''
                    }`}
                    onClick={() => setSection({ kind: 'type', type: t.type })}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            ))}
            <div className={setup.navGroup}>
              <p className={setup.navTitle}>Content</p>
              {catalog.content.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={`${setup.navItem} ${
                    section.kind === 'content' && section.key === c.key ? setup.navOn : ''
                  }`}
                  onClick={() => setSection({ kind: 'content', key: c.key })}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </nav>

          <section className={setup.main}>
            {activeType ? <ItemsPanel key={activeType.type} spec={activeType} /> : null}
            {section.kind === 'content' ? (
              <ContentPanel key={section.key} contentKey={section.key} />
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}

/** One type's options: a table, plus add / edit / activate. */
function ItemsPanel({ spec }: { spec: MetadataType }) {
  const [items, setItems] = useState<MetadataItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<MetadataItem | 'new' | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listItems(spec.type, controller.signal)
      .then((rows) => {
        if (!controller.signal.aborted) setItems(rows);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      });
    return () => controller.abort();
  }, [spec.type]);

  async function run(action: () => Promise<MetadataItem>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const saved = await action();
      setItems((rows) => {
        const others = (rows ?? []).filter((r) => r.id !== saved.id);
        return [...others, saved].sort((a, b) => a.order - b.order);
      });
      setEditing(null);
    } catch (cause: unknown) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  const columns = spec.fields.filter((f) => f.kind !== 'list');

  return (
    <div>
      <div className={setup.panelHead}>
        <div>
          <h2 className={setup.panelTitle}>{spec.label}</h2>
          <p className={setup.panelNote}>
            {items ? `${items.filter((i) => i.active).length} active of ${items.length}` : 'Loading…'}
          </p>
        </div>
        <button
          type="button"
          className={`${detail.btn} ${detail.approve}`}
          onClick={() => setEditing(editing === 'new' ? null : 'new')}
        >
          {editing === 'new' ? 'Close' : 'Add'}
        </button>
      </div>

      {error ? (
        <p className={`${detail.banner} ${detail.bannerBad}`} role="alert">
          {error}
        </p>
      ) : null}

      {editing ? (
        <ItemForm
          key={editing === 'new' ? 'new' : editing.id}
          spec={spec}
          existing={editing === 'new' ? undefined : editing}
          busy={busy}
          onCancel={() => setEditing(null)}
          onSubmit={(body) =>
            void run(() =>
              editing === 'new'
                ? createItem(spec.type, body)
                : updateItem(spec.type, editing.id, body),
            )
          }
        />
      ) : null}

      {items && items.length === 0 ? (
        <div className={list.empty}>
          <p className={list.emptyTitle}>Nothing here yet.</p>
          <p className={list.emptyHint}>
            Add the first one, or run <code>npm run seed:config</code> on the backend to load the
            standard set.
          </p>
        </div>
      ) : null}

      {items && items.length > 0 ? (
        <div className={list.tableWrap}>
          <table className={list.table}>
            <thead>
              <tr>
                <th>{spec.keyField}</th>
                {columns.map((f) => (
                  <th key={f.name}>{f.label}</th>
                ))}
                <th>Order</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td className={`${list.primaryCell} ${list.mono}`}>{row.key}</td>
                  {columns.map((f) => (
                    <td key={f.name}>{String(row.values[f.name] ?? '')}</td>
                  ))}
                  <td className={list.mono}>{row.order}</td>
                  <td>
                    <Pill
                      label={row.active ? 'Active' : 'Hidden'}
                      tone={row.active ? 'good' : 'bad'}
                    />
                  </td>
                  <td className={setup.rowActions}>
                    <button
                      type="button"
                      className={list.linkBtn}
                      onClick={() => setEditing(row)}
                      disabled={busy}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={list.linkBtn}
                      disabled={busy}
                      onClick={() =>
                        void run(() => updateItem(spec.type, row.id, { active: !row.active }))
                      }
                    >
                      {row.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

/** One content document. */
function ContentPanel({ contentKey }: { contentKey: ContentKey }) {
  const [doc, setDoc] = useState<ContentDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    listContent(controller.signal)
      .then((docs) => {
        if (!controller.signal.aborted) setDoc(docs.find((d) => d.key === contentKey) ?? null);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      });
    return () => controller.abort();
  }, [contentKey]);

  if (error) return <ListError error={error} />;
  if (!doc) return <p className={setup.panelNote}>Loading…</p>;
  return <ContentEditor key={doc.updatedAt ?? 'default'} doc={doc} onSaved={setDoc} />;
}

export default SetupPage;
