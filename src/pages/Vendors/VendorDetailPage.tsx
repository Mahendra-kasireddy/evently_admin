import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { errorMessage } from '../../lib/api/errors';
import { getVendor, setVendorActive } from '../../features/vendors/service';
import type { VendorDetail } from '../../features/vendors/types';
import { Pill } from '../../features/shared/ListChrome';
import { formatDate, formatMobile, orNotProvided } from '../../features/organizers/format';
import { formatINR } from '../../lib/format';
import { FullPageMessage } from '../../components/FullPageMessage';
import styles from '../Organizers/detail.module.css';
import list from '../../features/organizers/organizers.module.css';

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  const empty = !value.trim();
  return (
    <div className={`${styles.field} ${wide ? styles.wide : ''}`}>
      <p className={styles.fieldLabel}>{label}</p>
      <p className={`${styles.fieldValue} ${empty ? styles.fieldEmpty : ''}`}>
        {empty ? 'Not provided' : value}
      </p>
    </div>
  );
}

/**
 * One sub-vendor: their profile, the account behind it, which organizers work
 * with them, and what they have actually been assigned.
 *
 * The only write is the roster flag. Suspending the underlying account is a
 * different, heavier action and lives in Users — this page links there rather
 * than offering a second way to do it.
 */
export function VendorDetailPage() {
  const { id = '' } = useParams();
  const [detail, setDetail] = useState<VendorDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getVendor(id, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setDetail(data);
        setLoadError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(errorMessage(cause));
      });
    return () => controller.abort();
  }, [id]);

  async function toggle(active: boolean) {
    if (busy || !detail) return;
    setBusy(true);
    setActionError(null);
    try {
      setDetail(await setVendorActive(detail.id, active));
    } catch (cause: unknown) {
      setActionError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <div>
        <Link className={styles.back} to="/vendors">← Vendors</Link>
        <p className={list.error} role="alert">{loadError}</p>
      </div>
    );
  }
  if (!detail) return <FullPageMessage title="Loading vendor…" spinner />;

  const { work, account } = detail;
  const activeLinks = detail.organizers.filter((o) => o.status === 'active');

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <Link className={styles.back} to="/vendors">← Vendors</Link>

        <div className={styles.header}>
          <div>
            <h1 className={styles.name}>{orNotProvided(detail.fullName)}</h1>
            <div className={styles.metaRow}>
              <Pill label={detail.active ? 'On roster' : 'Off roster'} tone={detail.active ? 'good' : 'bad'} />
              <span className={styles.dot}>{detail.categoryLabel}</span>
              {detail.serviceArea ? <span className={styles.dot}>{detail.serviceArea}</span> : null}
              <span className={styles.dot}>Joined {formatDate(detail.createdAt)}</span>
            </div>
          </div>

          <div className={styles.actions}>
            {detail.active ? (
              <button
                type="button"
                className={`${styles.btn} ${styles.danger}`}
                disabled={busy}
                onClick={() => void toggle(false)}
              >
                {busy ? 'Working…' : 'Take off roster'}
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.btn} ${styles.approve}`}
                disabled={busy}
                onClick={() => void toggle(true)}
              >
                {busy ? 'Working…' : 'Put back on roster'}
              </button>
            )}
          </div>
        </div>

        {actionError ? (
          <p className={`${styles.banner} ${styles.bannerBad}`} role="alert">{actionError}</p>
        ) : null}

        {account?.suspended ? (
          <p className={`${styles.banner} ${styles.bannerBad}`}>
            <strong>Account suspended.</strong> This vendor cannot sign in at all, whatever the
            roster flag says. Manage that from <Link to={`/users/${account.id}`}>their account</Link>.
          </p>
        ) : detail.active ? (
          <p className={`${styles.banner} ${styles.bannerGood}`}>
            On the roster — organizers can assign work to this vendor.
          </p>
        ) : (
          <p className={`${styles.banner} ${styles.bannerWarn}`}>
            Off the roster. Organizers can’t assign new work; existing assignments are untouched.
          </p>
        )}
      </div>

      <div className={styles.scroller}>
        <div className={styles.grid}>
          <div>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Profile</h2>
              <div className={styles.fields}>
                <Field label="Category" value={detail.categoryLabel} />
                <Field label="Service area" value={detail.serviceArea} />
                <Field
                  label="Base rate"
                  value={
                    detail.baseRate > 0
                      ? `${formatINR(detail.baseRate)}${detail.baseRateUnit ? ` / ${detail.baseRateUnit}` : ''}`
                      : ''
                  }
                />
                <Field label="Minimum order" value={detail.minOrder > 0 ? formatINR(detail.minOrder) : ''} />
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Account</h2>
              {account ? (
                <>
                  <div className={styles.fields}>
                    <Field label="Name" value={account.name} />
                    <Field label="Email" value={account.email} />
                    <Field label="Mobile" value={formatMobile(account.phone)} />
                    <Field label="Sign-in" value={account.suspended ? 'Suspended' : 'Active'} />
                  </div>
                  <p className={styles.cardNote}>
                    <Link to={`/users/${account.id}`}>Open the full account →</Link>
                  </p>
                </>
              ) : (
                <p className={styles.cardNote}>
                  No user account is linked to this vendor profile.
                </p>
              )}
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Organizers ({activeLinks.length} active)</h2>
              {detail.organizers.length === 0 ? (
                <p className={styles.cardNote}>No organizer has linked this vendor yet.</p>
              ) : (
                <div className={styles.fields}>
                  {detail.organizers.map((o) => (
                    <Field
                      key={`${o.id}-${o.name}`}
                      label={o.name}
                      value={
                        o.rating !== null
                          ? `${o.status} · ${o.rating}★ from ${o.ratingCount} rating${o.ratingCount === 1 ? '' : 's'}`
                          : `${o.status} · not rated yet`
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className={styles.rail}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Work assigned</h2>
              <p className={styles.cardNote}>
                Counted across every booking task board that names this vendor.
              </p>
              <div className={styles.fields}>
                <Field label="Tasks assigned" value={String(work.assigned)} />
                <Field label="Accepted" value={String(work.accepted)} />
                <Field label="Completed" value={String(work.completed)} />
                <Field label="Agreed value" value={formatINR(work.agreedValue)} />
              </div>
              <p className={styles.cardNote}>
                Agreed value is what organizers recorded on those tasks. Evently holds no payout
                records, so this is not money paid.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
