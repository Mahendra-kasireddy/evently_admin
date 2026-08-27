import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { errorMessage } from '../../lib/api/errors';
import { listUsers, statusCounts } from '../../features/users/service';
import {
  ROLE_LABEL,
  STATUS_LABEL,
  USER_ROLES,
  USER_STATUSES,
  type UserRole,
  type UserRow,
  type UserStatus,
} from '../../features/users/types';
import { RoleTags, UserStatusPill } from '../../features/users/StatusPill';
import { formatDate, formatMobile, orNotProvided } from '../../features/organizers/format';
import styles from '../../features/organizers/organizers.module.css';

const PAGE_SIZE = 20;

function isRole(value: string | null): value is UserRole {
  return !!value && (USER_ROLES as readonly string[]).includes(value);
}
function isStatus(value: string | null): value is UserStatus {
  return !!value && (USER_STATUSES as readonly string[]).includes(value);
}

/**
 * Every Evently account, whatever role it holds.
 *
 * The Organizers section is the onboarding review queue; this is the
 * account-level view of the same people — who they are, whether they can sign
 * in, and what they hold. Filter, search and page state live in the URL, so an
 * admin can share "the suspended accounts" as a link.
 */
export function UsersPage() {
  const [params, setParams] = useSearchParams();
  const roleParam = params.get('role');
  const statusParam = params.get('status');
  const role = isRole(roleParam) ? roleParam : undefined;
  const status = isStatus(statusParam) ? statusParam : undefined;
  const search = params.get('q') ?? '';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  interface Loaded {
    key: string;
    rows: UserRow[];
    total: number;
    pages: number;
    counts: Record<string, number> | null;
    error: string | null;
  }
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [draft, setDraft] = useState(search);
  const [lastSearch, setLastSearch] = useState(search);

  const key = `${role ?? ''}|${status ?? ''}|${search}|${page}`;
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
      listUsers({ role, status, search, page, limit: PAGE_SIZE }, controller.signal),
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
  }, [role, status, search, page, key]);

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, page * PAGE_SIZE);

  return (
    <div>
      <div className={styles.head}>
        <div>
          <p className={styles.eyebrow}>Users</p>
          <h1 className={styles.title}>Accounts</h1>
          <p className={styles.subtitle}>
            Everyone with an Evently account — customers, organizers, sub-vendors and admins.
          </p>
        </div>
      </div>

      <div className={styles.controls}>
        <input
          className={styles.search}
          type="search"
          placeholder="Search name, email or mobile"
          aria-label="Search users"
          value={draft}
          onChange={(event) => onSearchChange(event.target.value)}
        />

        <div className={styles.chips} role="group" aria-label="Filter by role">
          <button
            type="button"
            className={`${styles.chip} ${!role && !status ? styles.chipOn : ''}`}
            onClick={() => setParam({ role: null, status: null, page: null })}
          >
            All
            {counts ? <span className={styles.chipCount}>{counts.all ?? 0}</span> : null}
          </button>
          {USER_ROLES.map((value) => (
            <button
              key={value}
              type="button"
              className={`${styles.chip} ${role === value ? styles.chipOn : ''}`}
              onClick={() => setParam({ role: value, page: null })}
            >
              {ROLE_LABEL[value]}
              {counts ? <span className={styles.chipCount}>{counts[value] ?? 0}</span> : null}
            </button>
          ))}
          {USER_STATUSES.map((value) => (
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
            <p className={styles.emptyTitle}>Loading accounts…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No accounts found.</p>
            <p className={styles.emptyHint}>
              {search || role || status
                ? 'Try a different search or filter.'
                : 'Accounts appear here as soon as someone signs up in the Evently app.'}
            </p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Roles</th>
                <th>Joined</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className={styles.primaryCell}>
                    {orNotProvided(row.name)}
                    {row.email ? <div className={styles.mutedCell}>{row.email}</div> : null}
                  </td>
                  <td className={styles.mono}>{formatMobile(row.phone)}</td>
                  <td>
                    <RoleTags roles={row.roles} />
                  </td>
                  <td className={styles.mono}>{formatDate(row.createdAt)}</td>
                  <td>
                    <UserStatusPill status={row.status} />
                  </td>
                  <td>
                    <Link className={styles.linkBtn} to={`/users/${row.id}`}>
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
