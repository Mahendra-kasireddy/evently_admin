import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { errorMessage } from '../../lib/api/errors';
import { listOrganizers, statusCounts } from '../../features/organizers/service';
import {
  ORGANIZER_STATUSES,
  STATUS_LABEL,
  type OrganizerRow,
  type OrganizerStatus,
} from '../../features/organizers/types';
import { Meter, StatusPill } from '../../features/organizers/StatusPill';
import {
  formatDate,
  formatMobile,
  orNotProvided,
} from '../../features/organizers/format';
import styles from '../../features/organizers/organizers.module.css';

const PAGE_SIZE = 20;

function isStatus(value: string | null): value is OrganizerStatus {
  return !!value && (ORGANIZER_STATUSES as readonly string[]).includes(value);
}

/**
 * The review queue.
 *
 * Filter, search and page state live in the URL, so an admin can hand a
 * colleague "the pending list" as a link and reloading keeps their place.
 */
export function OrganizersPage() {
  const [params, setParams] = useSearchParams();
  const statusParam = params.get('status');
  const status = isStatus(statusParam) ? statusParam : undefined;
  const search = params.get('q') ?? '';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  /**
   * One piece of state, stamped with the query it answers.
   *
   * `loading` is derived from that stamp rather than stored, so the fetch
   * effect never sets state synchronously — every write happens in a settled
   * promise callback, and a stale response can't overwrite a newer one.
   */
  interface Loaded {
    key: string;
    rows: OrganizerRow[];
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
  // Adjusting during render is the supported pattern; an effect here would be
  // a cascading render.
  if (search !== lastSearch) {
    setLastSearch(search);
    setDraft(search);
  }

  const setParam = useCallback(
    (patch: Record<string, string | null>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value === null || value === '') next.delete(key);
            else next.set(key, value);
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
      listOrganizers({ status, search, page, limit: PAGE_SIZE }, controller.signal),
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
        setLoaded({
          key,
          rows: [],
          total: 0,
          pages: 1,
          counts: null,
          error: errorMessage(cause),
        });
      });

    return () => controller.abort();
  }, [status, search, page, key]);

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, page * PAGE_SIZE);

  return (
    <div>
      <div className={styles.head}>
        <div>
          <p className={styles.eyebrow}>Organizers</p>
          <h1 className={styles.title}>Registrations and onboarding</h1>
          <p className={styles.subtitle}>
            Every organizer who registered through the Evently app, and where they are in review.
          </p>
        </div>
      </div>

      <div className={styles.controls}>
        <input
          className={styles.search}
          type="search"
          placeholder="Search name, business or mobile"
          aria-label="Search organizers"
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
          {ORGANIZER_STATUSES.map((value) => (
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
            <p className={styles.emptyTitle}>Loading organizers…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No organizers found.</p>
            <p className={styles.emptyHint}>
              {search || status
                ? 'Try a different search or status filter.'
                : 'Organizers appear here as soon as they register in the Evently app.'}
            </p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Business</th>
                <th>Contact</th>
                <th>Mobile</th>
                <th>Registered</th>
                <th>Status</th>
                <th>Onboarding</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className={styles.primaryCell}>
                    {orNotProvided(row.businessName)}
                    {row.city ? <div className={styles.mutedCell}>{row.city}</div> : null}
                  </td>
                  <td>{orNotProvided(row.contactName)}</td>
                  <td className={styles.mono}>{formatMobile(row.mobile)}</td>
                  <td className={styles.mono}>{formatDate(row.registeredAt)}</td>
                  <td>
                    <StatusPill status={row.status} />
                  </td>
                  <td>
                    <Meter percent={row.profileCompletion} />
                  </td>
                  <td>
                    <Link className={styles.linkBtn} to={`/organizers/${row.id}`}>
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
