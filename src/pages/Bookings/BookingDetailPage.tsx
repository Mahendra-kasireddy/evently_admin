import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { errorMessage } from '../../lib/api/errors';
import { getBooking } from '../../features/bookings/service';
import {
  BOOKING_STATUS_TONE, PAYMENT_STATUS_TONE, type BookingDetail,
} from '../../features/bookings/types';
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
 * One booking, end to end.
 *
 * Read-only. Moving a booking through its lifecycle belongs to the organizer,
 * and `PATCH /booking/:id/status` already enforces who may do it — a second
 * route in from the console would put an admin inside a customer-organizer
 * agreement.
 */
export function BookingDetailPage() {
  const { id = '' } = useParams();
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getBooking(id, controller.signal)
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
        <Link className={styles.back} to="/bookings">← Bookings</Link>
        <p className={list.error} role="alert">{loadError}</p>
      </div>
    );
  }
  if (!detail) return <FullPageMessage title="Loading booking…" spinner />;

  const awaiting = detail.status === 'awaiting_organizer' || detail.status === 'pending';

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <Link className={styles.back} to="/bookings">← Bookings</Link>

        <div className={styles.header}>
          <div>
            <h1 className={styles.name}>{orNotProvided(detail.title)}</h1>
            <div className={styles.metaRow}>
              <Pill label={detail.statusLabel} tone={BOOKING_STATUS_TONE[detail.status] ?? 'work'} />
              <Pill
                label={detail.paymentStatusLabel}
                tone={PAYMENT_STATUS_TONE[detail.paymentStatus] ?? 'wait'}
              />
              <span className={styles.mono}>{detail.ref}</span>
              <span className={styles.dot}>Event {formatDate(detail.eventDate)}</span>
            </div>
          </div>
        </div>

        {detail.status === 'rejected' && detail.declineReason ? (
          <p className={`${styles.banner} ${styles.bannerBad}`}>
            <strong>Declined by the organizer.</strong> {detail.declineReason}
          </p>
        ) : null}
        {awaiting ? (
          <p className={`${styles.banner} ${styles.bannerWarn}`}>
            Waiting on the organizer to accept
            {detail.organizerRespondBy ? ` — due ${formatDate(detail.organizerRespondBy)}` : ''}.
          </p>
        ) : null}
        {detail.status === 'expired' ? (
          <p className={`${styles.banner} ${styles.bannerBad}`}>
            The organizer never responded and this booking expired. The customer’s advance is
            eligible for a refund — Evently has no refund mechanism, so that is a manual action.
          </p>
        ) : null}
      </div>

      <div className={styles.scroller}>
        <div className={styles.grid}>
          <div>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Event</h2>
              <div className={styles.fields}>
                <Field label="Reference" value={detail.ref} />
                <Field label="Occasion" value={detail.occasion} />
                <Field label="Event date" value={formatDate(detail.eventDate)} />
                <Field label="Venue" value={detail.location} />
                <Field label="Booked on" value={formatDate(detail.createdAt)} />
                <Field label="Progress" value={`${detail.progress}%`} />
                <Field label="Description" value={detail.description} wide />
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Timeline</h2>
              {detail.timeline.length === 0 ? (
                <p className={styles.cardNote}>Nothing recorded yet.</p>
              ) : (
                <div className={styles.fields}>
                  {detail.timeline.map((e, i) => (
                    <Field
                      key={`${e.status}-${i}`}
                      label={formatDate(e.at ?? null)}
                      value={e.note ? `${e.label} — ${e.note}` : e.label}
                      wide
                    />
                  ))}
                </div>
              )}
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Vendor tasks ({detail.tasks.length})</h2>
              {detail.tasks.length === 0 ? (
                <p className={styles.cardNote}>
                  The organizer hasn’t built a task board for this booking yet.
                </p>
              ) : (
                <div className={styles.fields}>
                  {detail.tasks.map((t, i) => (
                    <Field
                      key={`${t.title}-${i}`}
                      label={t.title}
                      value={`${t.assigneeName || 'Unassigned'} · ${t.status} · ${t.assignmentStatus}${
                        t.amount > 0 ? ` · ${formatINR(t.amount)}` : ''
                      }`}
                      wide
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className={styles.rail}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Money</h2>
              <div className={styles.fields}>
                <Field label="Grand total" value={formatINR(detail.amount)} />
                <Field
                  label={`Advance (${detail.advancePercentage}%)`}
                  value={formatINR(detail.advanceAmount)}
                />
                <Field label="Recorded as paid" value={formatINR(detail.amountPaid)} />
                <Field label="Outstanding" value={formatINR(detail.outstanding)} />
                <Field label="Advance paid on" value={formatDate(detail.advancePaidAt)} />
              </div>
              <p className={styles.cardNote}>
                From the booking record. Evently holds no transactions, so “paid” is what the
                booking says, not a settlement confirmed by a payment provider.
              </p>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Parties</h2>
              <div className={styles.fields}>
                <Field label="Customer" value={detail.customer?.name ?? ''} />
                <Field label="Customer mobile" value={formatMobile(detail.customer?.phone ?? '')} />
                <Field label="Organizer" value={detail.organizer?.name ?? ''} />
              </div>
              {detail.customer ? (
                <p className={styles.cardNote}>
                  <Link to={`/users/${detail.customer.id}`}>Open the customer’s account →</Link>
                </p>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
