import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { errorMessage } from '../../lib/api/errors';
import { getEvent } from '../../features/events/service';
import { EVENT_STATUS_TONE, type EventDetail } from '../../features/events/types';
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
 * One event in the pipeline: the brief the customer wrote, every organizer that
 * priced it, and the booking it became if it got that far.
 *
 * Read-only. An admin cancelling somebody's request or answering on an
 * organizer's behalf would put them inside a negotiation they are not party to.
 */
export function EventDetailPage() {
  const { id = '' } = useParams();
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getEvent(id, controller.signal)
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

  if (loadError) {
    return (
      <div>
        <Link className={styles.back} to="/events">← Events</Link>
        <p className={list.error} role="alert">{loadError}</p>
      </div>
    );
  }
  if (!detail) return <FullPageMessage title="Loading event…" spinner />;

  const cheapest = detail.quotes.length
    ? Math.min(...detail.quotes.filter((q) => q.grandTotal > 0).map((q) => q.grandTotal))
    : null;

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <Link className={styles.back} to="/events">← Events</Link>

        <div className={styles.header}>
          <div>
            <h1 className={styles.name}>{orNotProvided(detail.occasion)}</h1>
            <div className={styles.metaRow}>
              <Pill label={detail.statusLabel} tone={EVENT_STATUS_TONE[detail.status] ?? 'work'} />
              {detail.when ? <span className={styles.dot}>{detail.when}</span> : null}
              {detail.where ? <span className={styles.dot}>{detail.where}</span> : null}
              <span className={styles.dot}>Requested {formatDate(detail.createdAt)}</span>
            </div>
          </div>
        </div>

        {detail.booking ? (
          <p className={`${styles.banner} ${styles.bannerGood}`}>
            <strong>Booked.</strong> This event became booking{' '}
            <Link to={`/bookings/${detail.booking.id}`}>{detail.booking.ref}</Link> —{' '}
            {formatINR(detail.booking.amount)}.
          </p>
        ) : detail.quotes.length === 0 ? (
          <p className={`${styles.banner} ${styles.bannerWarn}`}>
            No organizer has replied to this request yet.
          </p>
        ) : (
          <p className={`${styles.banner} ${styles.bannerWarn}`}>
            {detail.quotes.length} quote{detail.quotes.length === 1 ? '' : 's'} in
            {cheapest !== null ? `, from ${formatINR(cheapest)}` : ''} — the customer has not
            booked yet.
          </p>
        )}
      </div>

      <div className={styles.scroller}>
        <div className={styles.grid}>
          <div>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>The brief</h2>
              <div className={styles.fields}>
                <Field label="Occasion" value={detail.occasion} />
                <Field label="When" value={detail.when} />
                <Field label="Venue" value={detail.where} />
                <Field label="Guests" value={detail.guests} />
                <Field label="Budget" value={detail.budget} />
                <Field label="Services" value={detail.categories.join(', ')} />
                <Field label="Notes from the customer" value={detail.ideas} wide />
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Organizer responses ({detail.quotes.length})</h2>
              {detail.quotes.length === 0 ? (
                <p className={styles.cardNote}>
                  {detail.targetedOrganizer
                    ? `Sent to ${detail.targetedOrganizer}, who hasn't replied yet.`
                    : 'Broadcast to matched organizers. None have replied yet.'}
                </p>
              ) : (
                <div className={styles.fields}>
                  {detail.quotes.map((q) => (
                    <Field
                      key={q.id}
                      label={`${q.organizerName}${q.organizerTier ? ` · ${q.organizerTier}` : ''}`}
                      value={`${formatINR(q.grandTotal)} · ${q.advancePercentage}% advance · ${q.status} · ${formatDate(q.sentAt)}`}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className={styles.rail}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Customer</h2>
              {detail.customer ? (
                <>
                  <div className={styles.fields}>
                    <Field label="Name" value={detail.customer.name} />
                    <Field label="Email" value={detail.customer.email} />
                    <Field label="Mobile" value={formatMobile(detail.customer.phone)} />
                  </div>
                  <p className={styles.cardNote}>
                    <Link to={`/users/${detail.customer.id}`}>Open the full account →</Link>
                  </p>
                </>
              ) : (
                <p className={styles.cardNote}>The customer account is no longer available.</p>
              )}
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Sent to</h2>
              <p className={styles.cardNote}>
                {detail.targetedOrganizer
                  ? `One organizer: ${detail.targetedOrganizer}.`
                  : 'Broadcast to organizers matched on occasion, city and services.'}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
