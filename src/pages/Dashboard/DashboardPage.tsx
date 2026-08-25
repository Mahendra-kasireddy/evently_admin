import { useAuth } from '../../features/auth';
import styles from './dashboard.module.css';

/**
 * The dashboard shell.
 *
 * Everything shown here comes from `GET /user/getUserDetails` — the signed-in
 * account and nothing else. No counts, totals, charts or activity feeds: no
 * endpoint exists that reports them, and inventing numbers on an admin console
 * is worse than showing none.
 */
export function DashboardPage() {
  const { user } = useAuth();
  const firstName = (user?.name ?? '').trim().split(/\s+/)[0] || 'there';

  return (
    <div className={styles.page}>
      <p className={styles.eyebrow}>Dashboard</p>
      <h1 className={styles.title}>Welcome back, {firstName}</h1>
      <p className={styles.subtitle}>
        You’re signed in to the Evently administration console.
      </p>

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

      <section className={styles.next}>
        <p className={styles.nextTitle}>Nothing else is wired up yet</p>
        <p className={styles.nextText}>
          Users, organizers, vendors, events, bookings and payments are listed in the sidebar as
          placeholders. They stay unavailable until the admin endpoints behind them exist.
        </p>
      </section>
    </div>
  );
}
