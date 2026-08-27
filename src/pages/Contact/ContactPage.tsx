import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { errorMessage } from '../../lib/api/errors';
import { listContactRequests, statusCounts } from '../../features/contact/service';
import {
  CONTACT_STATUSES,
  STATUS_LABEL,
  type ContactRow,
  type ContactStatus,
} from '../../features/contact/types';
import { ContactStatusPill } from '../../features/contact/StatusPill';
import { formatDate, formatMobile } from '../../features/organizers/format';
import styles from '../../features/organizers/organizers.module.css';

const PAGE_SIZE = 20;

function isStatus(value: string | null): value is ContactStatus {
  return !!value && (CONTACT_STATUSES as readonly string[]).includes(value);
}

/**
 * The support queue.
 *
 * Deliberately the same shape as the organizers review queue — filter, search
 * and page state live in the URL, so an admin can hand a colleague "the new
 * messages" as a link and reloading keeps their place.
 */
export function ContactPage() {
  const [params, setParams] = useSearchParams();
  const statusParam = params.get('status');
  const status = isStatus(statusParam) ? statusParam : undefined;
  const search = params.get('q') ?? '';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  interface Loaded {
    key: string;
    rows: ContactRow[];
    total: number;
    pages: number;
    counts: Record<string, number> | null;
    error: string | null;
  }
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [draft, setDraft] = useState(search);
  const [lastSearch, setLastSearch] = useState(search);

  const key = `${status ?? ''}|${search}|${page}`;
  const loading = loaded?.key !== key;
  const rows = loaded?.rows ?? [];
  const total = loaded?.total ?? 0;
  const pages = loaded?.pages ?? 1;
  const counts = loaded?.counts ?? null;
  const error = loaded?.key === key ? loaded.error : null;

  // Re-sync the search box when the URL changes from outside (back button).
  if (search !== lastSearch) {
    setLastSearch(search);
    setDraft(search);
  }

  const setParam = useCallback(
    (patch: Record<string, string | null>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, value] of Object.entries(patch)) {
            if (value === null || value === '') next.delete(k);
            else next.set(k, value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const debounce = useRef<number | null>(null);
  function onSearchChange(value: string) {
    setDraft(value);
    if (debounce.current) window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => setParam({ q: value, page: null }), 300);
  }

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      listContactRequests({ status, search, page, limit: PAGE_SIZE }, controller.signal),
      statusCounts(controller.signal),
    ])
      .then(([listed, tally]) => {
        if (controller.signal.aborted) return;
        setLoaded({
          key,
          rows: listed.data,
          total: listed.meta.total,
          pages: listed.meta.pages,
          counts: tally,
          error: null,
        });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setLoaded({ key, rows: [], total: 0, pages: 1, counts: null, error: errorMessage(cause) });
      });

    return () => controller.abort();
  }, [status, search, page, key]);

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, page * PAGE_SIZE);

  return (
    <div>
      <div className={styles.head}>
        <div>
          <p className={styles.eyebrow}>Contact Us</p>
          <h1 className={styles.title}>Support requests</h1>
          <p className={styles.subtitle}>
            Messages sent through the Contact Us form by customers and by visitors with no account.
          </p>
        </div>
      </div>

      <div className={styles.controls}>
        <input
          className={styles.search}
          type="search"
          placeholder="Search name, email or mobile"
          aria-label="Search contact requests"
          value={draft}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <div className={styles.chips} role="group" aria-label="Filter by status">
          <button
            type="button"
            className={`${styles.chip} ${!status ? styles.chipOn : ''}`}
            onClick={() => setParam({ status: null, page: null })}
          >
            All
            {counts ? <span className={styles.chipCount}>{counts.all ?? 0}</span> : null}
          </button>
          {CONTACT_STATUSES.map((value) => (
            <button
              key={value}
              type="button"
              className={`${styles.chip} ${status === value ? styles.chipOn : ''}`}
              onClick={() => setParam({ status: value, page: null })}
            >
              {STATUS_LABEL[value]}
              {counts ? <span className={styles.chipCount}>{counts[value] ?? 0}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.empty} role="status">
            <p className={styles.emptyTitle}>Loading messages…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No messages found.</p>
            <p className={styles.emptyHint}>
              {search || status
                ? 'Try a different search or status filter.'
                : 'Messages appear here as soon as someone sends the Contact Us form.'}
            </p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Subject</th>
                <th>Received</th>
                <th>Updated</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className={styles.primaryCell}>
                    {row.name}
                    <div className={styles.mutedCell}>
                      {row.email}
                      {row.isGuest ? ' · Guest' : ''}
                    </div>
                  </td>
                  <td className={styles.mono}>{formatMobile(row.phone)}</td>
                  <td>{row.subjectLabel}</td>
                  <td className={styles.mono}>{formatDate(row.createdAt)}</td>
                  <td className={styles.mono}>{formatDate(row.updatedAt)}</td>
                  <td>
                    <ContactStatusPill status={row.status} />
                  </td>
                  <td>
                    <Link className={styles.linkBtn} to={`/contact-us/${row.id}`}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > 0 ? (
        <div className={styles.pager}>
          <span>
            {from}–{to} of {total}
          </span>
          <div className={styles.pagerBtns}>
            <button
              type="button"
              className={styles.pagerBtn}
              disabled={page <= 1}
              onClick={() => setParam({ page: String(page - 1) })}
            >
              Previous
            </button>
            <button
              type="button"
              className={styles.pagerBtn}
              disabled={page >= pages}
              onClick={() => setParam({ page: String(page + 1) })}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
