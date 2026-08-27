import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { errorMessage } from '../../lib/api/errors';
import { getUser, setUserStatus } from '../../features/users/service';
import type { UserDetail } from '../../features/users/types';
import { RoleTags, UserStatusPill } from '../../features/users/StatusPill';
import { useAuth } from '../../features/auth';
import { formatDate, formatMobile, orNotProvided } from '../../features/organizers/format';
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
 * One account: who they are, what they hold, what they've actually done, and
 * whether they can sign in.
 *
 * Suspending is a server action. It flips the status *and* revokes the stored
 * refresh token, so the account is genuinely locked out rather than merely
 * labelled — see AdminUserService.setStatus.
 */
export function UserDetailPage() {
  const { id = '' } = useParams();
  const { user: me } = useAuth();
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getUser(id, controller.signal)
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

  async function run(action: () => Promise<UserDetail>, after?: () => void) {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    try {
      setDetail(await action());
      after?.();
    } catch (cause: unknown) {
      setActionError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <div>
        <Link className={styles.back} to="/users">
          ← Users
        </Link>
        <p className={list.error} role="alert">
          {loadError}
        </p>
      </div>
    );
  }

  if (!detail) return <FullPageMessage title="Loading account…" spinner />;

  const suspended = detail.status === 'suspended';
  // The API refuses this too; hiding it here just avoids offering a dead button.
  const isSelf = !!me?.id && me.id === detail.id;
  const { activity } = detail;

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <Link className={styles.back} to="/users">
          ← Users
        </Link>

        <div className={styles.header}>
          <div>
            <h1 className={styles.name}>{orNotProvided(detail.name)}</h1>
            <div className={styles.metaRow}>
              <UserStatusPill status={detail.status} />
              <span className={styles.mono}>{formatMobile(detail.phone)}</span>
              <span className={styles.dot}>Joined {formatDate(detail.createdAt)}</span>
              {detail.phoneVerified ? (
                <span className={styles.liveTag}>Mobile verified</span>
              ) : null}
            </div>
          </div>

          <div>
            <div className={styles.actions}>
              {suspended ? (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.approve}`}
                  disabled={busy}
                  onClick={() => void run(() => setUserStatus(detail.id, 'active'))}
                >
                  {busy ? 'Working…' : 'Reactivate account'}
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.danger}`}
                  disabled={busy || isSelf}
                  onClick={() => setConfirming(true)}
                >
                  Suspend account
                </button>
              )}
            </div>
            {isSelf ? (
              <p className={styles.blocked}>This is your own account — you can’t suspend it.</p>
            ) : null}
          </div>
        </div>

        {actionError ? (
          <p className={`${styles.banner} ${styles.bannerBad}`} role="alert">
            {actionError}
          </p>
        ) : null}

        {suspended ? (
          <p className={`${styles.banner} ${styles.bannerBad}`}>
            <strong>Suspended.</strong> This account cannot sign in and its session has been
            revoked. Any access token it already holds stops working within an hour.
          </p>
        ) : (
          <p className={`${styles.banner} ${styles.bannerGood}`}>
            Active — this account can sign in normally.
          </p>
        )}

        {confirming ? (
          <div className={styles.dialog}>
            <p className={styles.dialogTitle}>Suspend this account?</p>
            <p className={styles.dialogNote}>
              {orNotProvided(detail.name)} will be signed out and blocked from logging in again,
              by mobile OTP or password, until an admin reactivates them. Their bookings and data
              are untouched.
            </p>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.btn} onClick={() => setConfirming(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.danger}`}
                disabled={busy}
                onClick={() =>
                  void run(
                    () => setUserStatus(detail.id, 'suspended'),
                    () => setConfirming(false),
                  )
                }
              >
                {busy ? 'Working…' : 'Suspend account'}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className={styles.scroller}>
        <div className={styles.grid}>
          <div>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Account</h2>
              <div className={styles.fields}>
                <Field label="Name" value={detail.name} />
                <Field label="Email" value={detail.email} />
                <Field label="Mobile" value={formatMobile(detail.phone)} />
                <Field label="City" value={detail.city} />
                <Field label="Mobile verified" value={detail.phoneVerified ? 'Yes' : 'No'} />
                <Field label="Joined" value={formatDate(detail.createdAt)} />
                <Field label="Last updated" value={formatDate(detail.updatedAt)} />
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Roles</h2>
              <p className={styles.cardNote}>
                An account can hold several roles at once. Roles are granted by the flows that
                earn them — organizer onboarding, sub-vendor invites — and are not editable here.
              </p>
              <div style={{ marginTop: 12 }}>
                <RoleTags roles={detail.roles} />
              </div>
            </section>
          </div>

          <div className={styles.rail}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Activity</h2>
              <p className={styles.cardNote}>
                Real counts from this account’s own records — what to check before acting on it.
              </p>
              <div className={styles.fields}>
                <Field label="Bookings" value={String(activity.bookings)} />
                <Field label="Quote requests" value={String(activity.quoteRequests)} />
                <Field label="Plans" value={String(activity.plans)} />
              </div>
              {activity.bookings > 0 && !suspended ? (
                <p className={styles.cardNote}>
                  This account has live bookings. Suspending it blocks their sign-in; it does not
                  cancel anything.
                </p>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
