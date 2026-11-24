import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { errorMessage } from '../../lib/api/errors';
import { MOBILE_PATTERN } from '../../features/auth';
import { getTeam, inviteAdmin, removeAdmin, revokeInvite } from '../../features/team/service';
import type { Team } from '../../features/team/types';
import { formatDate, formatMobile } from '../../features/organizers/format';
import list from '../../features/organizers/organizers.module.css';
import styles from './team.module.css';

/**
 * Who can use the console, and inviting someone new.
 *
 * Sign-up is invite-only: a number added here gets a pending invite, and its
 * owner joins by choosing "Sign up" on the console's sign-in page and
 * verifying that number. Nothing else grants the admin role.
 */
export function TeamPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const load = useCallback((signal?: AbortSignal) => {
    getTeam(signal)
      .then((data) => {
        if (signal?.aborted) return;
        setTeam(data);
        setLoadError(null);
      })
      .catch((cause: unknown) => {
        if (signal?.aborted) return;
        setLoadError(errorMessage(cause));
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function onInvite(event: FormEvent) {
    event.preventDefault();
    if (inviting) return;
    if (name.trim().length < 2) {
      setFormError('Enter their name');
      return;
    }
    if (!MOBILE_PATTERN.test(mobile)) {
      setFormError('Enter a valid 10-digit mobile number');
      return;
    }
    setFormError(null);
    setNotice(null);
    setInviting(true);
    try {
      await inviteAdmin(name.trim(), mobile);
      setNotice(`Invite created. Ask ${name.trim()} to open this console and choose “Sign up”.`);
      setName('');
      setMobile('');
      load();
    } catch (cause) {
      setFormError(errorMessage(cause));
    } finally {
      setInviting(false);
    }
  }

  async function run(id: string, confirmText: string, action: () => Promise<void>) {
    if (!window.confirm(confirmText)) return;
    setActionError(null);
    setNotice(null);
    setPendingId(id);
    try {
      await action();
      load();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <div className={list.head}>
        <div>
          <p className={list.eyebrow}>Team</p>
          <h1 className={list.title}>Admin team</h1>
          <p className={list.subtitle}>
            Sign-up is invite-only. Invite someone by mobile number; they join by choosing “Sign up”
            on the sign-in page and verifying that number.
          </p>
        </div>
      </div>

      <form className={styles.inviteCard} onSubmit={onInvite} noValidate>
        <h2 className={styles.cardTitle}>Invite an admin</h2>
        <div className={styles.inviteRow}>
          <label className={styles.field}>
            <span className={styles.label}>Name</span>
            <input
              className={styles.input}
              value={name}
              maxLength={80}
              placeholder="e.g. Ravi Kumar"
              disabled={inviting}
              onChange={(event) => {
                setName(event.target.value);
                setFormError(null);
              }}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Mobile number</span>
            <span className={styles.phone}>
              <span className={styles.prefix}>+91</span>
              <input
                className={styles.phoneInput}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit number"
                value={mobile}
                disabled={inviting}
                onChange={(event) => {
                  setMobile(event.target.value.replace(/\D/g, '').slice(0, 10));
                  setFormError(null);
                }}
              />
            </span>
          </label>
          <button className={styles.inviteBtn} type="submit" disabled={inviting}>
            {inviting ? 'Inviting…' : 'Send invite'}
          </button>
        </div>
        {formError ? (
          <p className={list.error} role="alert">
            {formError}
          </p>
        ) : null}
        {notice ? (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        ) : null}
      </form>

      {loadError ? (
        <p className={list.error} role="alert">
          {loadError}
        </p>
      ) : null}
      {actionError ? (
        <p className={list.error} role="alert">
          {actionError}
        </p>
      ) : null}

      <h2 className={styles.sectionTitle}>
        Pending invites{team ? ` · ${team.invites.length}` : ''}
      </h2>
      <div className={list.tableWrap}>
        {!team ? (
          <div className={list.empty} role="status">
            <p className={list.emptyTitle}>Loading…</p>
          </div>
        ) : team.invites.length === 0 ? (
          <div className={list.empty}>
            <p className={list.emptyTitle}>No pending invites.</p>
            <p className={list.emptyHint}>Invites appear here until the person signs up.</p>
          </div>
        ) : (
          <table className={list.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Invited by</th>
                <th>Invited on</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {team.invites.map((invite) => (
                <tr key={invite.id}>
                  <td className={list.primaryCell}>{invite.name}</td>
                  <td className={list.mono}>{formatMobile(invite.phone)}</td>
                  <td>{invite.invitedBy}</td>
                  <td className={list.mono}>{formatDate(invite.createdAt)}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      disabled={pendingId === invite.id}
                      onClick={() =>
                        void run(invite.id, `Revoke the invite for ${invite.name}?`, () =>
                          revokeInvite(invite.id),
                        )
                      }
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2 className={styles.sectionTitle}>Admins{team ? ` · ${team.admins.length}` : ''}</h2>
      <div className={list.tableWrap}>
        {!team ? (
          <div className={list.empty} role="status">
            <p className={list.emptyTitle}>Loading…</p>
          </div>
        ) : (
          <table className={list.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Account since</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {team.admins.map((admin) => (
                <tr key={admin.id}>
                  <td className={list.primaryCell}>
                    {admin.name}
                    {admin.isYou ? <span className={styles.youTag}>You</span> : null}
                  </td>
                  <td className={list.mono}>{formatMobile(admin.phone)}</td>
                  <td className={list.mono}>{formatDate(admin.since)}</td>
                  <td>
                    {admin.isYou || team.admins.length <= 1 ? null : (
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        disabled={pendingId === admin.id}
                        onClick={() =>
                          void run(
                            admin.id,
                            `Remove admin access for ${admin.name}? They keep their Evently account.`,
                            () => removeAdmin(admin.id),
                          )
                        }
                      >
                        Remove access
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
