import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { getDashboardSummary } from '../../features/dashboard/service';
import type { DashboardSummary } from '../../features/dashboard/types';
import { errorMessage } from '../../lib/api/errors';
import { formatINR } from '../../lib/format';
import styles from './dashboard.module.css';

/** Where each section tile leads. Keys match the backend's section keys. */
const SECTION_HREF: Record<string, string> = {
  users: '/users',
  organizers: '/organizers',
  vendors: '/vendors',
  events: '/events',
  bookings: '/bookings',
  contact: '/contact-us',
};

/** What the section's `attention` number actually means, in the tile's own words. */
const ATTENTION_LABEL: Record<string, string> = {
  users: 'suspended',
  organizers: 'to review',
  vendors: 'off roster',
  events: 'awaiting a decision',
  bookings: 'awaiting an organizer',
  contact: 'unread',
};

/**
 * The console's front door.
 *
 * Every number here is a count or a sum of stored documents, served by
 * `GET /admin/dashboard/getSummary`. Nothing is estimated, projected or
 * invented — an admin acting on a made-up figure is worse off than one looking
 * at an empty screen, which is what this page used to be.
 */
export function DashboardPage() {
  const { user } = useAuth();
  const firstName = (user?.name ?? '').trim().split(/\s+/)[0] || 'there';

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    getDashboardSummary(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setSummary(data);
        setError(null);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(errorMessage(cause));
        setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <div className={styles.page}>
      <p className={styles.eyebrow}>Dashboard</p>
      <h1 className={styles.title}>Welcome back, {firstName}</h1>
      <p className={styles.subtitle}>Everything happening across Evently right now.</p>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {/* ----------------------------------------------------- needs attention */}
      <section className={styles.block}>
        <h2 className={styles.blockTitle}>Needs attention</h2>
        {loading ? (
          <p className={styles.placeholder} role="status">
            Loading…
          </p>
        ) : !summary || summary.attention.length === 0 ? (
          <p className={styles.clear}>
            Nothing is waiting on you. Every queue is empty.
          </p>
        ) : (
          <ul className={styles.queue}>
            {summary.attention.map((item) => (
              <li key={item.key}>
                {/* The href is already filtered to exactly what the count
                    counts, so clicking lands on those records and no others. */}
                <Link to={item.href} className={`${styles.queueRow} ${styles[item.tone]}`}>
                  <span className={styles.queueCount}>{item.count}</span>
                  <span className={styles.queueLabel}>{item.label}</span>
                  <span className={styles.queueGo} aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------------------ sections */}
      <section className={styles.block}>
        <h2 className={styles.blockTitle}>Across the console</h2>
        {loading ? (
          <p className={styles.placeholder} role="status">
            Loading…
          </p>
        ) : (
          <div className={styles.tiles}>
            {(summary?.sections ?? []).map((section) => (
              <Link
                key={section.key}
                to={SECTION_HREF[section.key] ?? '/dashboard'}
                className={styles.tile}
              >
                <p className={styles.tileLabel}>{section.label}</p>
                <p className={styles.tileValue}>{section.total.toLocaleString('en-IN')}</p>
                <p className={styles.tileNote}>
                  {section.attention > 0
                    ? `${section.attention} ${ATTENTION_LABEL[section.key] ?? 'to review'}`
                    : 'Nothing outstanding'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- finance */}
      <section className={styles.block}>
        <h2 className={styles.blockTitle}>Booking finance</h2>
        {loading ? (
          <p className={styles.placeholder} role="status">
            Loading…
          </p>
        ) : (
          <>
            <div className={styles.tiles}>
              <Link to="/payments" className={styles.tile}>
                <p className={styles.tileLabel}>Contracted value</p>
                <p className={styles.tileValue}>{formatINR(summary?.finance.contractedValue)}</p>
                <p className={styles.tileNote}>Live bookings only</p>
              </Link>
              <Link to="/payments?paymentStatus=advance_paid" className={styles.tile}>
                <p className={styles.tileLabel}>Recorded as collected</p>
                <p className={`${styles.tileValue} ${styles.good}`}>
                  {formatINR(summary?.finance.collected)}
                </p>
                <p className={styles.tileNote}>Advances taken at booking time</p>
              </Link>
              <Link to="/payments" className={styles.tile}>
                <p className={styles.tileLabel}>Outstanding</p>
                <p className={`${styles.tileValue} ${styles.warn}`}>
                  {formatINR(summary?.finance.outstanding)}
                </p>
                <p className={styles.tileNote}>Balances due after each event</p>
              </Link>
            </div>
            <p className={styles.caveat}>
              Summed from booking records. Evently stores no transactions and has no payment
              provider connected, so “collected” is what bookings state was paid — not a
              settlement confirmed by a gateway. Cancelled, declined and expired bookings are
              excluded.
            </p>
          </>
        )}
      </section>

      {/* -------------------------------------------------------------- account */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Your account</h2>
        <p className={styles.cardNote}>Loaded from your Evently profile.</p>
        <div className={styles.rows}>
          <div className={styles.row}>
            <p className={styles.rowLabel}>Name</p>
            <p className={styles.rowValue}>{user?.name?.trim() || '—'}</p>
          </div>
          <div className={styles.row}>
            <p className={styles.rowLabel}>Mobile</p>
            <p className={styles.rowValue}>{user?.phone ? `+91 ${user.phone}` : '—'}</p>
          </div>
          <div className={styles.row}>
            <p className={styles.rowLabel}>Email</p>
            <p className={styles.rowValue}>{user?.email || '—'}</p>
          </div>
          <div className={styles.row}>
            <p className={styles.rowLabel}>Roles</p>
            <div className={styles.pills}>
              {(user?.roles ?? []).map((role) => (
                <span key={role} className={styles.pill}>
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
