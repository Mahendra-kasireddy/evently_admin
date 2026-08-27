import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { errorMessage } from '../../lib/api/errors';
import {
  getContactRequest,
  respondToContactRequest,
  updateContactStatus,
} from '../../features/contact/service';
import {
  STATUS_LABEL,
  type ContactDetail,
  type ContactStatus,
} from '../../features/contact/types';
import { ContactStatusPill } from '../../features/contact/StatusPill';
import { formatDate, formatMobile } from '../../features/organizers/format';
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

/** Statuses an admin can move a request to directly, other than responding. */
const MANUAL: ContactStatus[] = ['new', 'in_progress', 'closed'];

/**
 * One support request: who wrote in, what they said, and the reply.
 *
 * Responding is a server action — the reply, the admin who sent it and the
 * timestamp are all persisted by `POST /admin/contact-us/respond/:id`, which
 * also moves the request to RESPONDED. Nothing here is local state pretending
 * a message was sent.
 */
export function ContactDetailPage() {
  const { id = '' } = useParams();
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    getContactRequest(id, controller.signal)
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

  async function run(action: () => Promise<ContactDetail>, after?: () => void) {
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
        <Link className={styles.back} to="/contact-us">
          ← Contact Us
        </Link>
        <p className={list.error} role="alert">
          {loadError}
        </p>
      </div>
    );
  }

  if (!detail) {
    return <FullPageMessage title="Loading message…" spinner />;
  }

  const hasReply = detail.response.trim().length > 0;

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <Link className={styles.back} to="/contact-us">
          ← Contact Us
        </Link>

        <div className={styles.header}>
          <div>
            <h1 className={styles.name}>{detail.name}</h1>
            <div className={styles.metaRow}>
              <ContactStatusPill status={detail.status} />
              <span className={styles.dot}>{detail.subjectLabel}</span>
              <span className={styles.dot}>Received {formatDate(detail.createdAt)}</span>
              {detail.isGuest ? (
                <span className={styles.liveTag}>Guest — no account</span>
              ) : (
                <span className={styles.liveTag}>Signed-in customer</span>
              )}
            </div>
          </div>

          <div>
            <div className={styles.actions}>
              {MANUAL.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={styles.btn}
                  disabled={busy || detail.status === value}
                  onClick={() => void run(() => updateContactStatus(detail.id, value))}
                >
                  {detail.status === value ? `${STATUS_LABEL[value]}` : `Mark ${STATUS_LABEL[value].toLowerCase()}`}
                </button>
              ))}
            </div>
            <p className={styles.blocked}>
              Sending a response moves this to {STATUS_LABEL.responded.toLowerCase()} automatically.
            </p>
          </div>
        </div>

        {actionError ? (
          <p className={`${styles.banner} ${styles.bannerBad}`} role="alert">
            {actionError}
          </p>
        ) : null}

        {detail.status === 'new' ? (
          <p className={`${styles.banner} ${styles.bannerWarn}`}>
            This message hasn’t been picked up yet.
          </p>
        ) : null}
        {detail.status === 'responded' ? (
          <p className={`${styles.banner} ${styles.bannerGood}`}>
            Responded {formatDate(detail.respondedAt)}.
            {detail.responseEmailed
              ? ' The reply was emailed to the customer.'
              : ' The reply is saved' +
                (detail.isGuest
                  ? ' but was not emailed — no email provider is configured, so this customer has not been reached yet.'
                  : ' and delivered in the customer’s Evently notifications. It was not emailed — no email provider is configured.')}
          </p>
        ) : null}
        {detail.status === 'closed' ? (
          <p className={`${styles.banner} ${styles.bannerWarn}`}>This request is closed.</p>
        ) : null}
      </div>

      <div className={styles.scroller}>
        <div className={styles.grid}>
          <div>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Customer information</h2>
              <div className={styles.fields}>
                <Field label="Name" value={detail.name} />
                <Field label="Email" value={detail.email} />
                <Field label="Mobile" value={formatMobile(detail.phone)} />
                <Field label="Account" value={detail.isGuest ? 'Guest (not signed in)' : 'Signed-in Evently customer'} />
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Request</h2>
              <div className={styles.fields}>
                <Field label="Subject" value={detail.subjectLabel} />
                <Field label="Submitted" value={formatDate(detail.createdAt)} />
                <Field label="Message" value={detail.message} wide />
              </div>
            </section>
          </div>

          <div className={styles.rail}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Response</h2>
              {hasReply ? (
                <>
                  <p className={styles.cardNote}>
                    Sent {formatDate(detail.respondedAt)}
                    {detail.responseEmailed ? ' · emailed' : ' · not emailed'}
                  </p>
                  <div className={styles.fields}>
                    <Field label="Reply sent" value={detail.response} wide />
                  </div>
                  <p className={styles.cardNote}>
                    Sending again replaces this reply and re-stamps who answered.
                  </p>
                </>
              ) : (
                <p className={styles.cardNote}>
                  The customer sees this text. It is saved against the request and, for a
                  signed-in customer, delivered to their Evently notifications.
                </p>
              )}

              <textarea
                className={styles.textarea}
                placeholder={hasReply ? 'Write a new response…' : 'Write your response…'}
                aria-label="Response"
                value={reply}
                onChange={(event) => setReply(event.target.value)}
              />
              <div className={styles.dialogActions}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.approve}`}
                  disabled={reply.trim().length < 5 || busy}
                  onClick={() =>
                    void run(
                      () => respondToContactRequest(detail.id, reply.trim()),
                      () => setReply(''),
                    )
                  }
                >
                  {busy ? 'Working…' : 'Send response'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
